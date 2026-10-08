// ============================================================
// XORA — Authentication Service
// backend/services/authService.js
// ============================================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { getJwtSecret, getJwtExpiresIn } = require("../config/auth");

const SALT_ROUNDS = 10;

function formatRoles(roles) {
  if (Array.isArray(roles)) return roles;
  if (typeof roles === "string") {
    const cleaned = roles.replace(/^\{|\}$/g, "").trim();
    return cleaned ? cleaned.split(",").map((r) => r.trim()) : [];
  }
  return [];
}

const authService = {
  /**
   * Generate JWT token for user
   */
  generateToken(userId) {
    return jwt.sign({ userId }, getJwtSecret(), {
      expiresIn: getJwtExpiresIn(),
    });
  },

  /**
   * Register a new learner user with database transaction
   */
  async register({ name, email, password }) {
    const normalizedEmail = (typeof email === "string" ? email.trim() : "").toLowerCase();
    const trimmedName = typeof name === "string" ? name.trim() : "";

    // Check if email already registered
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      const error = new Error("Email sudah terdaftar");
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Database transaction to create user, assign role, and create learner profile
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert user
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         RETURNING id, name, email, status, created_at, updated_at`,
        [trimmedName, normalizedEmail, passwordHash]
      );
      const user = userResult.rows[0];

      // 2. Fetch LEARNER role ID (or create if not yet seeded)
      let roleResult = await client.query(
        "SELECT id FROM roles WHERE name = 'LEARNER'"
      );
      if (roleResult.rows.length === 0) {
        roleResult = await client.query(
          "INSERT INTO roles (name, description) VALUES ('LEARNER', 'Pelajar yang menggunakan platform Xora') RETURNING id"
        );
      }
      const roleId = roleResult.rows[0].id;

      // 3. Assign role to user
      await client.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
        [user.id, roleId]
      );

      // 4. Create learner profile
      await client.query(
        "INSERT INTO learner_profiles (user_id) VALUES ($1)",
        [user.id]
      );

      await client.query("COMMIT");

      // Return safe user object with roles and token
      const token = this.generateToken(user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          roles: ["LEARNER"],
          createdAt: user.created_at,
        },
        token,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Login user with email and password
   */
  async login({ email, password }) {
    const normalizedEmail = (typeof email === "string" ? email.trim() : "").toLowerCase();

    // Find user by email
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.name, u.status, u.created_at,
              COALESCE(ARRAY_AGG(r.name::text) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.email = $1
       GROUP BY u.id`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      const error = new Error("Email atau password tidak valid");
      error.statusCode = 401;
      throw error;
    }

    const user = userResult.rows[0];

    // Check account status
    if (user.status !== "ACTIVE") {
      const error = new Error("Akun sedang tidak aktif atau dinonaktifkan");
      error.statusCode = 403;
      throw error;
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error("Email atau password tidak valid");
      error.statusCode = 401;
      throw error;
    }

    // Generate token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        roles: formatRoles(user.roles),
        createdAt: user.created_at,
      },
      token,
    };
  },

  /**
   * Get user details by ID (for /api/auth/me and auth middleware)
   */
  async getUserById(userId) {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.status, u.created_at, u.updated_at,
              COALESCE(ARRAY_AGG(r.name::text) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (!result.rows[0]) return null;

    const user = result.rows[0];
    return {
      ...user,
      roles: formatRoles(user.roles),
    };
  },
};

module.exports = authService;
