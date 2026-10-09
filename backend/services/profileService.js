// ============================================================
// XORA — Learner Profile Service
// backend/services/profileService.js
// ============================================================

const pool = require("../db");

function formatRoles(roles) {
  if (Array.isArray(roles)) return roles;
  if (typeof roles === "string") {
    const cleaned = roles.replace(/^\{|\}$/g, "").trim();
    return cleaned ? cleaned.split(",").map((r) => r.trim()) : [];
  }
  return [];
}

const profileService = {
  /**
   * Get learner profile along with user info and preferred subject details
   */
  async getLearnerProfile(userId) {
    const result = await pool.query(
      `SELECT
         u.id AS user_id,
         u.name,
         u.email,
         u.status,
         COALESCE(ARRAY_AGG(r.name::text) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
         lp.id AS profile_id,
         lp.learning_goal,
         lp.experience_level,
         lp.preferred_subject_id,
         lp.onboarding_completed,
         s.id AS subject_id,
         s.name AS subject_name,
         s.description AS subject_description
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN learner_profiles lp ON lp.user_id = u.id
       LEFT JOIN subjects s ON s.id = lp.preferred_subject_id
       WHERE u.id = $1
       GROUP BY u.id, lp.id, s.id`,
      [userId]
    );

    if (result.rows.length === 0) {
      const err = new Error("Pengguna tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const row = result.rows[0];

    if (!row.profile_id) {
      const err = new Error("Profil pembelajar tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    return {
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        status: row.status,
        roles: formatRoles(row.roles),
      },
      profile: {
        learning_goal: row.learning_goal,
        experience_level: row.experience_level,
        preferred_subject_id: row.preferred_subject_id,
        preferred_subject: row.preferred_subject_id
          ? {
              id: row.subject_id,
              name: row.subject_name,
              description: row.subject_description,
            }
          : null,
        onboarding_completed: row.onboarding_completed,
      },
    };
  },

  /**
   * Update learner profile and optionally user's name atomically in a transaction
   */
  async updateLearnerProfile(userId, { name, learning_goal, experience_level, preferred_subject_id }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Verify user and profile exist
      const check = await client.query(
        "SELECT u.id, lp.id AS profile_id FROM users u LEFT JOIN learner_profiles lp ON lp.user_id = u.id WHERE u.id = $1",
        [userId]
      );

      if (check.rows.length === 0) {
        const err = new Error("Pengguna tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      if (!check.rows[0].profile_id) {
        const err = new Error("Profil pembelajar tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      // 2. Update users.name if provided
      if (typeof name === "string") {
        await client.query(
          "UPDATE users SET name = $1 WHERE id = $2",
          [name.trim(), userId]
        );
      }

      // 3. Verify preferred_subject_id if provided and not null
      if (preferred_subject_id !== undefined && preferred_subject_id !== null) {
        const subjCheck = await client.query(
          "SELECT id FROM subjects WHERE id = $1",
          [preferred_subject_id]
        );

        if (subjCheck.rows.length === 0) {
          const err = new Error("Subject pilihan tidak ditemukan");
          err.statusCode = 404;
          throw err;
        }
      }

      // 4. Update learner_profiles fields dynamically
      const updates = [];
      const values = [];
      let pIndex = 1;

      if (learning_goal !== undefined) {
        updates.push(`learning_goal = $${pIndex++}`);
        values.push(typeof learning_goal === "string" ? learning_goal.trim() : null);
      }

      if (experience_level !== undefined) {
        updates.push(`experience_level = $${pIndex++}`);
        values.push(typeof experience_level === "string" ? experience_level.trim() : null);
      }

      if (preferred_subject_id !== undefined) {
        updates.push(`preferred_subject_id = $${pIndex++}`);
        values.push(preferred_subject_id);
      }

      if (updates.length > 0) {
        values.push(userId);
        await client.query(
          `UPDATE learner_profiles SET ${updates.join(", ")} WHERE user_id = $${pIndex}`,
          values
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return this.getLearnerProfile(userId);
  },

  /**
   * Complete onboarding by marking onboarding_completed = true
   */
  async completeOnboarding(userId) {
    const result = await pool.query(
      `UPDATE learner_profiles
       SET onboarding_completed = TRUE
       WHERE user_id = $1
       RETURNING onboarding_completed`,
      [userId]
    );

    if (result.rows.length === 0) {
      const err = new Error("Profil pembelajar tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    return {
      onboarding_completed: true,
    };
  },
};

module.exports = profileService;
