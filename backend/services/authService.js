// ============================================================
// XORA — Authentication service (register / login / logout / me)
// backend/services/authService.js
// ============================================================
// FR-01..FR-05: sign up, login, logout, kelola sesi, profil minat & tujuan.
// Penyimpanan password memakai bcrypt (lihat utils/password.js).
// ============================================================

const pool = require("../db");
const passwordUtils = require("../utils/password");
const sessionService = require("./sessionService");
const { badRequest, conflict, unauthorized } = require("../utils/errors");

// Batas bcrypt: maksimal 72 byte input. Lebih dari itu dipotong library,
// jadi divalidasi di sini agar pesannya jelas ke pengguna.
const MAX_PASSWORD_BYTES = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput({ name, email, password }) {
  const cleanName = String(name ?? "").trim();
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const cleanPassword = String(password ?? "");

  if (cleanName.length < 2 || cleanName.length > 100) {
    throw badRequest("Name must be between 2 and 100 characters");
  }
  if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254) {
    throw badRequest("Please provide a valid email address");
  }
  if (cleanPassword.length < 8) {
    throw badRequest("Password must be at least 8 characters");
  }
  if (Buffer.byteLength(cleanPassword, "utf8") > MAX_PASSWORD_BYTES) {
    throw badRequest(`Password must be at most ${MAX_PASSWORD_BYTES} bytes`);
  }

  return { name: cleanName, email: cleanEmail, password: cleanPassword };
}

/** Catat event login/logout ke learning_events agar jejak audit tersedia. */
async function recordAuthEvent(userId, eventType) {
  try {
    await pool.query(
      `INSERT INTO learning_events (learner_id, event_type, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'user', $1, $3)`,
      [userId, eventType, JSON.stringify({ at: new Date().toISOString() })]
    );
  } catch (error) {
    // Kegagalan audit tidak boleh menggagalkan login.
    console.error("AUTH EVENT LOG FAILED:", error.message);
  }
}

const authService = {
  /**
   * Daftar akun learner baru + buat sesi aktif.
   * @returns {{user: object, token: string, expiresAt: Date}}
   */
  async register(input) {
    const { name, email, password } = validateRegisterInput(input);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const passwordHash = await passwordUtils.hash(password);

      const inserted = await client.query(
        `INSERT INTO users (email, password_hash, name, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         ON CONFLICT (email) DO NOTHING
         RETURNING id, email, name, status, created_at`,
        [email, passwordHash, name]
      );

      if (!inserted.rows[0]) {
        throw conflict("An account with this email already exists");
      }

      const user = inserted.rows[0];

      // Profil disiapkan kosong; onboarding (FR-02..FR-04) mengisinya nanti.
      await client.query(
        `INSERT INTO learner_profiles (user_id, onboarding_completed)
         VALUES ($1, false)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );

      // Beri role LEARNER jika tabel roles sudah terisi (aman saat belum di-seed).
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, r.id FROM roles r WHERE r.name = 'LEARNER'
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [user.id]
      );

      const session = await sessionService.create(user.id, client);

      await client.query("COMMIT");

      return {
        user: { id: user.id, email: user.email, name: user.name, status: user.status },
        token: session.token,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Login dengan email + password.
   * Pesan error sengaja sama untuk "email tidak ada" dan "password salah"
   * agar tidak bisa dipakai menebak daftar email yang terdaftar.
   */
  async login({ email, password }) {
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanPassword = String(password ?? "");

    if (!cleanEmail || !cleanPassword) {
      throw badRequest("Email and password are required");
    }

    const result = await pool.query(
      `SELECT id, email, name, status, password_hash
         FROM users
        WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    const user = result.rows[0];

    if (!user || !passwordUtils.verify(cleanPassword, user.password_hash)) {
      // Bedakan penyebab hanya di log server, bukan ke client.
      if (user && !passwordUtils.isValidHash(user.password_hash)) {
        console.error(
          `LOGIN BLOCKED: stored hash for ${user.email} is not a valid bcrypt hash ` +
            `(length=${String(user.password_hash || "").length}). ` +
            `This account was seeded with a placeholder hash and cannot sign in until re-seeded.`
        );
      }
      throw unauthorized("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw unauthorized("This account is not active");
    }

    const session = await sessionService.create(user.id);
    await recordAuthEvent(user.id, "LOGIN");

    return {
      user: { id: user.id, email: user.email, name: user.name, status: user.status },
      token: session.token,
      expiresAt: session.expiresAt,
    };
  },

  /** Logout: cabut sesi aktif milik request berjalan. */
  async logout(token, userId) {
    const revoked = await sessionService.revoke(token);
    if (userId && revoked > 0) {
      await recordAuthEvent(userId, "LOGOUT");
    }
    return { revoked };
  },

  /** Profil singkat user yang sedang login. */
  async me(userId) {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.status, u.created_at,
              lp.learning_goal, lp.experience_level, lp.preferred_subject_id,
              lp.onboarding_completed,
              -- Cast eksplisit: tanpa ::text[] pada COALESCE, PostgreSQL
              -- mengirim string literal "{LEARNER}" alih-alih array JS.
              COALESCE(
                (SELECT array_agg(r.name::text ORDER BY r.name)
                   FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                  WHERE ur.user_id = u.id),
                '{}'
              )::text[] AS roles
         FROM users u
         LEFT JOIN learner_profiles lp ON lp.user_id = u.id
        WHERE u.id = $1`,
      [userId]
    );

    const row = result.rows[0];
    if (!row) throw unauthorized("Account no longer exists");

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      status: row.status,
      createdAt: row.created_at,
      roles: row.roles,
      onboarding: {
        completed: Boolean(row.onboarding_completed),
        learningGoal: row.learning_goal,
        experienceLevel: row.experience_level,
        preferredSubjectId: row.preferred_subject_id,
      },
    };
  },
};

module.exports = authService;
