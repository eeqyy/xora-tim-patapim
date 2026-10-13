// ============================================================
// XORA — Admin: Kesehatan Sistem & Data — Editorial Grid System
// frontend/src/pages/AdminSystemPage.jsx
// ============================================================
// Memantau status database, statistik data, aktivitas terbaru
// (learning_events & audit_logs), dan ringkasan analytics.
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// ============================================================

import React, { useEffect, useState } from "react";
import { adminSystemApi } from "../services/api";
import {
  PageContainer,
  PageHeader,
  Grid,
  GridCell,
  SectionHeader,
  StatCard,
  StatusBadge,
  SecondaryButton,
  LoadingState,
  EmptyState,
  Alert,
  MicroMeta,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
  HAIRLINE,
  INK,
  MUTED,
  cx,
} from "../components";

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

const VALUE_CLASS = cx("text-sm font-bold", INK);

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
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="Kesehatan Sistem"
        description="Status database, statistik data, aktivitas terbaru, dan ringkasan analytics platform Xora."
        actions={
          <SecondaryButton
            size="sm"
            onClick={loadAll}
            disabled={isLoading}
          >
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </SecondaryButton>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {isLoading && !health && <LoadingState message="Memuat data sistem..." />}

      {health && (
        <>
          <SectionHeader id="system-status" index="01" title="Status Sistem" />
          <Grid cols={3} className="mt-8">
            <GridCell className="flex flex-col justify-between gap-2">
              <MicroMeta>Database</MicroMeta>
              <StatusBadge
                status={health.database === "connected" ? "ACTIVE" : "SUSPENDED"}
                label={health.database === "connected" ? "Terhubung" : "Terputus"}
                variant={health.database === "connected" ? "success" : "error"}
                dot
              />
            </GridCell>
            <GridCell className="flex flex-col justify-between gap-2">
              <MicroMeta>Latensi DB</MicroMeta>
              <span className={VALUE_CLASS}>
                {health.db_latency_ms != null ? `${health.db_latency_ms} ms` : "—"}
              </span>
            </GridCell>
            <GridCell className="flex flex-col justify-between gap-2">
              <MicroMeta>Uptime</MicroMeta>
              <span className={VALUE_CLASS}>{formatUptime(health.uptime_seconds)}</span>
            </GridCell>
            <GridCell className="flex flex-col justify-between gap-2">
              <MicroMeta>Node.js</MicroMeta>
              <span className={VALUE_CLASS}>{health.node_version || "—"}</span>
            </GridCell>
            <GridCell className="flex flex-col justify-between gap-2">
              <MicroMeta>Dicek pada</MicroMeta>
              <span className={VALUE_CLASS}>{formatDateTime(health.timestamp)}</span>
            </GridCell>
          </Grid>
        </>
      )}

      {stats && (
        <>
          <SectionHeader id="user-stats" index="02" title="Statistik Pengguna" />
          <Grid cols={3} className="mt-8">
            <StatCard label="Total Pengguna" value={stats.total_users} />
            <StatCard label="Aktif" value={stats.active_users} variant="success" />
            <StatCard label="Nonaktif" value={stats.inactive_users} variant="neutral" />
            <StatCard label="Suspend" value={stats.suspended_users} variant="error" />
            <StatCard label="Admin" value={stats.admin_users} variant="info" />
            <StatCard label="Sesi Aktif" value={stats.active_sessions} variant="info" />
          </Grid>

          <SectionHeader id="content-stats" index="03" title="Statistik Konten & Aktivitas" />
          <Grid cols={3} className="mt-8">
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
          </Grid>
        </>
      )}

      {analytics && (
        <>
          <SectionHeader id="analytics" index="04" title="Ringkasan Analytics" />
          <Grid cols={3} className="mt-8">
            <StatCard label="Learner Terlacak" value={summary.learners_tracked ?? 0} />
            <StatCard
              label="Rata-rata Mastery"
              value={summary.average_mastery != null ? `${summary.average_mastery}` : "—"}
              variant="info"
            />
            <StatCard
              label="Konsep Dikuasai"
              value={summary.total_mastered_concepts ?? 0}
              variant="success"
            />
            <StatCard label="Gap Aktif" value={summary.total_active_gaps ?? 0} variant="error" />
            <StatCard label="Aksi Selesai" value={summary.total_completed_actions ?? 0} />
            <StatCard
              label="Total Waktu Belajar"
              value={`${summary.total_learning_minutes ?? 0} mnt`}
            />
          </Grid>

          <SectionHeader id="top-gaps" index="05" title="Konsep dengan Gap Terbanyak" />
          {topGaps.length === 0 ? (
            <EmptyState
              title="Belum Ada Data Analytics"
              description="Belum ada data analytics konsep. Data akan terisi seiring peserta mengerjakan asesmen."
            />
          ) : (
            <div className={cx("mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
              <table className={TABLE_CLASS}>
                <thead>
                  <tr>
                    <th scope="col" className={TH_CLASS}>
                      Konsep
                    </th>
                    <th scope="col" className={TH_CLASS}>
                      Jumlah Gap
                    </th>
                    <th scope="col" className={TH_CLASS}>
                      Jumlah Error
                    </th>
                    <th scope="col" className={TH_CLASS}>
                      Rata-rata Mastery
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topGaps.map((g) => (
                    <tr key={g.concept_name}>
                      <th scope="row" className={cx(TD_CLASS, "font-bold")}>
                        {g.concept_name}
                      </th>
                      <td className={cx(TD_CLASS, "tabular-nums")}>{g.gap_count}</td>
                      <td className={cx(TD_CLASS, "tabular-nums")}>{g.error_count}</td>
                      <td className={cx(TD_CLASS, "tabular-nums")}>{g.average_mastery ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <SectionHeader id="activity" index="06" title="Aktivitas Terbaru" />

      <SectionHeader id="learning-events" index="07" title="Event Belajar (learning_events)" />
      {activity.events.length === 0 ? (
        <EmptyState
          title="Belum Ada Event Belajar"
          description="Belum ada event belajar."
        />
      ) : (
        <div className={cx("mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
          <table className={TABLE_CLASS}>
            <thead>
              <tr>
                <th scope="col" className={TH_CLASS}>
                  Waktu
                </th>
                <th scope="col" className={TH_CLASS}>
                  Event
                </th>
                <th scope="col" className={TH_CLASS}>
                  Pelaku
                </th>
                <th scope="col" className={TH_CLASS}>
                  Entitas
                </th>
              </tr>
            </thead>
            <tbody>
              {activity.events.map((ev) => (
                <tr key={ev.id}>
                  <td className={cx(TD_CLASS, MUTED)}>{formatDateTime(ev.occurred_at)}</td>
                  <td className={TD_CLASS}>{ev.event_type}</td>
                  <td className={cx(TD_CLASS, "font-bold")}>{ev.actor_name || "—"}</td>
                  <td className={cx(TD_CLASS, MUTED)}>{ev.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SectionHeader id="audit-log" index="08" title="Audit Log (aksi penting)" />
      {activity.audits.length === 0 ? (
        <EmptyState title="Belum Ada Catatan Audit" description="Belum ada catatan audit." />
      ) : (
        <div className={cx("mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
          <table className={TABLE_CLASS}>
            <thead>
              <tr>
                <th scope="col" className={TH_CLASS}>
                  Waktu
                </th>
                <th scope="col" className={TH_CLASS}>
                  Aksi
                </th>
                <th scope="col" className={TH_CLASS}>
                  Pelaku
                </th>
                <th scope="col" className={TH_CLASS}>
                  Tipe Pelaku
                </th>
                <th scope="col" className={TH_CLASS}>
                  Entitas
                </th>
              </tr>
            </thead>
            <tbody>
              {activity.audits.map((a) => (
                <tr key={a.id}>
                  <td className={cx(TD_CLASS, MUTED)}>{formatDateTime(a.occurred_at)}</td>
                  <td className={TD_CLASS}>{ACTION_LABELS[a.action] || a.action}</td>
                  <td className={cx(TD_CLASS, "font-bold")}>{a.actor_name || "—"}</td>
                  <td className={cx(TD_CLASS, MUTED)}>{a.actor_type}</td>
                  <td className={cx(TD_CLASS, MUTED)}>{a.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
