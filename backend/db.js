const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = require("pg");

// SSL aktif secara default (aman untuk Postgres remote seperti Supabase).
// Matikan hanya jika eksplisit DATABASE_SSL=false (Postgres lokal tanpa SSL).
const useSsl = String(process.env.DATABASE_SSL || "").toLowerCase() !== "false";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  // Ramah serverless (Vercel): batasi jumlah koneksi per instance fungsi.
  // Untuk produksi, pakai koneksi "pooled" dari Supabase/Neon.
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
  console.error("PG POOL ERROR:", err);
});

module.exports = pool;