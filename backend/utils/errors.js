// ============================================================
// XORA — Error handling helpers
// backend/utils/errors.js
// ============================================================
// Dipakai routes untuk menjaga bentuk respons konsisten dengan kode
// yang sudah ada: { status: "error", message } + kode HTTP yang benar.
// ============================================================

/**
 * Error dengan kode HTTP eksplisit.
 * Sengaja ringan — tanpa stack ke client, stack hanya dicatat di server.
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** 400 — permintaan tidak valid (field hilang/format salah). */
const badRequest = (message) => new ApiError(400, message);

/** 401 — belum login / token tidak valid. */
const unauthorized = (message = "Authentication required") =>
  new ApiError(401, message);

/** 403 — sudah login tapi tidak berhak atas resource ini. */
const forbidden = (message = "Forbidden") => new ApiError(403, message);

/** 404 — resource tidak ditemukan. */
const notFound = (message = "Resource not found") => new ApiError(404, message);

/** 409 — bentrok (misal email sudah terdaftar). */
const conflict = (message) => new ApiError(409, message);

/**
 * Kirim error sebagai respons HTTP dengan bentuk standar XORA.
 *
 * - ApiError -> statusnya dipakai apa adanya
 * - error lain -> 500 dan pesan generik (jangan bocorkan detail internal)
 */
function sendError(res, error) {
  if (error && error.name === "ApiError") {
    return res.status(error.status).json({
      status: "error",
      message: error.message,
    });
  }

  console.error("UNEXPECTED ERROR:", error && error.stack ? error.stack : error);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  sendError,
};
