const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = require("pg");

// SSL aktif secara default (aman untuk Postgres remote seperti Supabase).
// Matikan hanya jika eksplisit DATABASE_SSL=false (Postgres lokal tanpa SSL).
const useSsl = String(process.env.DATABASE_SSL || "").toLowerCase() !== "false";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("PG POOL ERROR:", err);
});

module.exports = pool;