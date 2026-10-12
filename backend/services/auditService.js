// ============================================================
// XORA — Audit Log Service
// backend/services/auditService.js
// ============================================================
// Mencatat aksi penting (terutama aksi admin) ke tabel audit_logs.
// Dipakai oleh routes/admin.js dan route admin lain yang membutuhkan
// jejak audit.
//
// Prinsip: kegagalan mencatat audit TIDAK boleh menggagalkan aksi utama,
// jadi error di sini ditelan dan hanya dicatat ke log server.
// ============================================================

const pool = require("../db");

const auditService = {
  /**
   * Simpan satu baris audit.
   *
   * @param {object} entry
   * @param {string} entry.actorId    uuid pelaku
   * @param {string} [entry.actorType]  LEARNER | ADMIN | SYSTEM | AI_SERVICE
   * @param {string} entry.action     CREATE | UPDATE | DELETE | PUBLISH | ARCHIVE | LOGIN | LOGOUT | VERIFY
   * @param {string} entry.entityType nama entitas (mis. "user", "assessment")
   * @param {string} entry.entityId   uuid entitas
   * @param {object} [entry.oldValue] nilai sebelum (opsional)
   * @param {object} [entry.newValue] nilai sesudah (opsional)
   * @param {string} [entry.ipAddress]
   * @param {object} [client] klien pg opsional — isi bila dipanggil dalam transaksi
   */
  async log(entry, client = pool) {
    const {
      actorId,
      actorType = "ADMIN",
      action,
      entityType,
      entityId,
      oldValue = null,
      newValue = null,
      ipAddress = null,
    } = entry || {};

    if (!actorId || !action || !entityType || !entityId) return null;

    try {
      const result = await client.query(
        `INSERT INTO audit_logs
           (actor_id, actor_type, action, entity_type, entity_id, old_value, new_value, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, occurred_at`,
        [
          actorId,
          actorType,
          action,
          entityType,
          entityId,
          oldValue != null ? JSON.stringify(oldValue) : null,
          newValue != null ? JSON.stringify(newValue) : null,
          ipAddress || null,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("AUDIT LOG FAILED:", error.message);
      return null;
    }
  },
};

module.exports = auditService;
