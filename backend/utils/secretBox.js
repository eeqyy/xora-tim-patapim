// ============================================================
// XOLEARN — Secret Box (enkripsi kredensial AI)
// backend/utils/secretBox.js
// ============================================================
// Enkripsi simetris AES-256-GCM memakai kunci turunan dari env
// AI_CREDENTIALS_SECRET. Dipakai untuk menyimpan API key provider AI
// di tabel ai_provider_settings tanpa menaruh key mentah di DB.
//
// Format payload: "v1:<iv-b64>:<authTag-b64>:<ciphertext-b64>"
//
// Catatan penting: mengubah AI_CREDENTIALS_SECRET membuat key yang
// sudah tersimpan TIDAK bisa didekripsi lagi. Jangan diganti
// sembarangan setelah admin menyimpan key.
// ============================================================

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

/** True bila secret enkripsi tersedia. */
function isConfigured() {
  return Boolean((process.env.AI_CREDENTIALS_SECRET || "").trim());
}

/**
 * Turunkan kunci 32-byte dari secret (SHA-256, cukup untuk dev/prod
 * tanpa menambah dependency KDF).
 */
function deriveKey() {
  const secret = (process.env.AI_CREDENTIALS_SECRET || "").trim();
  if (!secret) {
    const err = new Error(
      "AI_CREDENTIALS_SECRET belum diisi. Set dulu di .env sebelum menyimpan API key AI."
    );
    err.status = 500;
    throw err;
  }
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

/**
 * Enkripsi string biasa → payload teks aman disimpan di kolom TEXT.
 */
function encrypt(plainText) {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Dekripsi payload dari encrypt(). Melempar error bila secret salah
 * atau payload rusak (auth tag tidak cocok).
 */
function decrypt(payload) {
  const key = deriveKey();
  const parts = String(payload || "").split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    const err = new Error("Format ciphertext API key tidak dikenal");
    err.status = 500;
    throw err;
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt, isConfigured };
