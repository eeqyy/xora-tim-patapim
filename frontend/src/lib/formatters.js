// ============================================================
// XORA — Formatter utilitas (tanggal, waktu, angka)
// frontend/src/lib/formatters.js
// ============================================================

export function formatDate(iso, { withTime = false } = {}) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const opts = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) {
      opts.hour = "2-digit";
      opts.minute = "2-digit";
    }
    return new Intl.DateTimeFormat("id-ID", opts).format(d);
  } catch {
    return String(iso);
  }
}

export function formatTimeAgo(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(iso);
}

export function formatClock(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const rest = String(s % 60).padStart(2, "0");
  return `${m}:${rest}`;
}

export function formatScore(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${Number(value).toFixed(digits)}%`;
}

export function formatRatio(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${Math.round(value * 100)}%`;
}

export function truncate(str, len = 60) {
  if (!str) return "";
  return str.length > len ? `${str.slice(0, len)}…` : str;
}