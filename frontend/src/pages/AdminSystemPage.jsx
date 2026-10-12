// ============================================================
// XORA — Admin: Kesehatan Sistem & Data
// frontend/src/pages/AdminSystemPage.jsx
// ============================================================
// Memantau status database, statistik data, aktivitas terbaru
// (learning_events & audit_logs), dan ringkasan analytics.
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// ============================================================

import React, { useEffect, useState } from "react";
import { adminSystemApi } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("id-ID");
  } catch {
    return String(value);
  }
}

function formatUptime(seconds) {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const ACTION_LABELS = {
  CREATE: "Buat",
  UPDATE: "Ubah",
  DELETE: "Hapus",
  PUBLISH: "Terbitkan",
  ARCHIVE: "Arsipkan",
  LOGIN: "Masuk",
  LOGOUT: "Keluar",
  VERIFY: "Verifikasi",
};

export default function AdminSystemPage() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState({ events: [], audits: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [healthRes, statsRes, analyticsRes, activityRes] = await Promise.all([
        adminSystemApi.getHealth(),
        adminSystemApi.getStats(),
        adminSystemApi.getAnalytics(),
        adminSystemApi.getActivity({ limit: 10 }),
      ]);
      setHealth(healthRes?.data || null);
      setStats(statsRes?.data || null);
      setAnalytics(analyticsRes?.data || null);
      setActivity({
        events: activityRes?.data?.events || [],
        audits: activityRes?.data?.audits || [],
      });
    } catch (err) {
      setError(err.message || "Gagal memuat data pemantauan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const summary = analytics?.summary || {};
  const topGaps = analytics?.top_gap_concepts || [];

  return (
    <div className="assessment-container">
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kesehatan Sistem</h1>
            <p className="assessment-subtitle">
              Status database, statistik data, aktivitas terbaru, dan ringkasan
              analytics platform Xora.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadAll}
            disabled={isLoading}
          >
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {isLoading && !health && (
        <div className="card loading-card">
          <p>Memuat data sistem...</p>
        </div>
      )}

      {health && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 className="admin-section-heading">Status Sistem</h2>
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span className="admin-detail-label">Database</span>
              <StatusBadge
                status={health.database === "connected" ? "ACTIVE" : "SUSPENDED"}
                label={health.database === "connected" ? "Terhubung" : "Terputus"}
                variant={health.database === "connected" ? "success" : "error"}
                dot
              />
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Latensi DB</span>
              <span className="admin-detail-value">
                {health.db_latency_ms != null ? `${health.db_latency_ms} ms` : "—"}
              </span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Uptime</span>
              <span className="admin-detail-value">{formatUptime(health.uptime_seconds)}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Node.js</span>
              <span className="admin-detail-value">{health.node_version || "—"}</span>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Dicek pada</span>
              <span className="admin-detail-value">{formatDateTime(health.timestamp)}</span>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <>
          <h2 className="admin-section-heading">Statistik Pengguna</h2>
          <div className="map-summary-bar">
            <StatCard label="Total Pengguna" value={stats.total_users} />
            <StatCard label="Aktif" value={stats.active_users} variant="success" />
            <StatCard label="Nonaktif" value={stats.inactive_users} variant="neutral" />
            <StatCard label="Suspend" value={stats.suspended_users} variant="error" />
            <StatCard label="Admin" value={stats.admin_users} variant="info" />
            <StatCard label="Sesi Aktif" value={stats.active_sessions} variant="info" />
          </div>

          <h2 className="admin-section-heading">Statistik Konten & Aktivitas</h2>
          <div className="map-summary-bar">
            <StatCard
              label="Subjek"
              value={stats.subjects}
              secondary={`${stats.published_subjects} terbit`}
            />
            <StatCard label="Level" value={stats.levels} />
            <StatCard label="Topik" value={stats.topics} />
            <StatCard label="Konsep" value={stats.concepts} />
            <StatCard label="Asesmen" value={stats.assessments} />
            <StatCard
              label="Soal"
              value={stats.questions}
              secondary={`${stats.active_questions} aktif`}
            />
            <StatCard
              label="Pengerjaan"
              value={stats.attempts}
              secondary={`${stats.completed_attempts} selesai`}
            />
            <StatCard label="Event Belajar" value={stats.learning_events} />
            <StatCard label="Audit Log" value={stats.audit_logs} />
          </div>
        </>
      )}

      {analytics && (
        <>
          <h2 className="admin-section-heading">Ringkasan Analytics</h2>
          <div className="map-summary-bar">
            <StatCard label="Learner Terlacak" value={summary.learners_tracked ?? 0} />
            <StatCard
              label="Rata-rata Mastery"
              value={summary.average_mastery != null ? `${summary.average_mastery}` : "—"}
              variant="info"
            />
            <StatCard label="Konsep Dikuasai" value={summary.total_mastered_concepts ?? 0} variant="success" />
            <StatCard label="Gap Aktif" value={summary.total_active_gaps ?? 0} variant="error" />
            <StatCard label="Aksi Selesai" value={summary.total_completed_actions ?? 0} />
            <StatCard
              label="Total Waktu Belajar"
              value={`${summary.total_learning_minutes ?? 0} mnt`}
            />
          </div>

          <div className="card admin-table-card" style={{ marginBottom: "1.5rem" }}>
            <h2 className="admin-section-heading" style={{ marginTop: 0 }}>
              Konsep dengan Gap Terbanyak
            </h2>
            {topGaps.length === 0 ? (
              <p className="admin-cell-muted">
                Belum ada data analytics konsep. Data akan terisi seiring peserta
                mengerjakan asesmen.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Konsep</th>
                      <th scope="col">Jumlah Gap</th>
                      <th scope="col">Jumlah Error</th>
                      <th scope="col">Rata-rata Mastery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGaps.map((g) => (
                      <tr key={g.concept_name}>
                        <th scope="row" className="admin-cell-title">
                          {g.concept_name}
                        </th>
                        <td className="admin-cell-num">{g.gap_count}</td>
                        <td className="admin-cell-num">{g.error_count}</td>
                        <td className="admin-cell-num">{g.average_mastery ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <h2 className="admin-section-heading">Aktivitas Terbaru</h2>
      <div className="card admin-table-card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="admin-subheading">Event Belajar (learning_events)</h3>
        {activity.events.length === 0 ? (
          <p className="admin-cell-muted">Belum ada event belajar.</p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Waktu</th>
                  <th scope="col">Event</th>
                  <th scope="col">Pelaku</th>
                  <th scope="col">Entitas</th>
                </tr>
              </thead>
              <tbody>
                {activity.events.map((ev) => (
                  <tr key={ev.id}>
                    <td className="admin-cell-muted">{formatDateTime(ev.occurred_at)}</td>
                    <td>{ev.event_type}</td>
                    <td className="admin-cell-title">{ev.actor_name || "—"}</td>
                    <td className="admin-cell-muted">{ev.entity_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card admin-table-card">
        <h3 className="admin-subheading">Audit Log (aksi penting)</h3>
        {activity.audits.length === 0 ? (
          <p className="admin-cell-muted">Belum ada catatan audit.</p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Waktu</th>
                  <th scope="col">Aksi</th>
                  <th scope="col">Pelaku</th>
                  <th scope="col">Tipe Pelaku</th>
                  <th scope="col">Entitas</th>
                </tr>
              </thead>
              <tbody>
                {activity.audits.map((a) => (
                  <tr key={a.id}>
                    <td className="admin-cell-muted">{formatDateTime(a.occurred_at)}</td>
                    <td>{ACTION_LABELS[a.action] || a.action}</td>
                    <td className="admin-cell-title">{a.actor_name || "—"}</td>
                    <td className="admin-cell-muted">{a.actor_type}</td>
                    <td className="admin-cell-muted">{a.entity_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
