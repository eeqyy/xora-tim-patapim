// ============================================================
// XOLEARN — Admin: Kesehatan Sistem & Data — Editorial Grid System
// frontend/src/pages/AdminSystemPage.jsx
// ============================================================
// Memantau status database, statistik data, aktivitas terbaru
// (learning_events & audit_logs), dan ringkasan analytics.
//
// Aktivitas disajikan sebagai baris akordeon (buka satu per satu)
// supaya ringkas di HP; tabel angka memakai kelas `table-cards`
// sehingga berubah jadi daftar kartu di layar sempit.
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// ============================================================

import { useEffect, useState } from "react";
import { adminSystemApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  PageContainer,
  PageHeader,
  Grid,
  GridCell,
  SectionHeader,
  StatCard,
  StatusBadge,
  SecondaryButton,
  AccordionRow,
  SkeletonSummary,
  SkeletonTable,
  EmptyState,
  Alert,
  AnimatedContent,
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
const DT_CLASS = cx("text-[11px] font-semibold uppercase tracking-[0.14em]", MUTED);
const DD_CLASS = cx("text-[13px] font-semibold", INK);

export default function AdminSystemPage() {
  const toast = useToast();

  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState({ events: [], audits: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openKey, setOpenKey] = useState(null);

  const loadAll = async ({ manual = false } = {}) => {
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
      if (manual) toast.success("Data sistem dimuat ulang.");
    } catch (err) {
      setError(err.message || "Gagal memuat data pemantauan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRow = (key) => setOpenKey((prev) => (prev === key ? null : key));

  const summary = analytics?.summary || {};
  const topGaps = analytics?.top_gap_concepts || [];
  const initialLoading = isLoading && !health;

  return (
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="Kesehatan Sistem"
        description="Status database, statistik data, aktivitas terbaru, dan ringkasan analytics platform Xolearn."
        actions={
          <SecondaryButton
            size="sm"
            onClick={() => loadAll({ manual: true })}
            disabled={isLoading}
          >
            {isLoading ? "Memuat..." : "Muat Ulang"}
          </SecondaryButton>
        }
      />

      {error && (
        <Alert tone="error" className="mt-8">
          {error}
        </Alert>
      )}

      {initialLoading && (
        <>
          <SkeletonSummary className="mt-8" />
          <SkeletonTable rows={4} columns={4} className="mt-10" />
        </>
      )}

      {health && (
        <>
          <SectionHeader id="system-status" index="1" title="Status Sistem" />
          <AnimatedContent>
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
          </AnimatedContent>
        </>
      )}

      {stats && (
        <>
          <SectionHeader id="user-stats" index="2" title="Statistik Pengguna" />
          <AnimatedContent>
            <Grid cols={3} className="mt-8">
              <StatCard label="Total Pengguna" value={stats.total_users} />
              <StatCard label="Aktif" value={stats.active_users} variant="success" />
              <StatCard label="Nonaktif" value={stats.inactive_users} variant="neutral" />
              <StatCard label="Suspend" value={stats.suspended_users} variant="error" />
              <StatCard label="Admin" value={stats.admin_users} variant="info" />
              <StatCard label="Sesi Aktif" value={stats.active_sessions} variant="info" />
            </Grid>
          </AnimatedContent>

          <SectionHeader id="content-stats" index="3" title="Statistik Konten & Aktivitas" />
          <AnimatedContent>
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
          </AnimatedContent>
        </>
      )}

      {analytics && (
        <>
          <SectionHeader id="analytics" index="4" title="Ringkasan Analytics" />
          <AnimatedContent>
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
          </AnimatedContent>
        </>
      )}

      {analytics && (
        <>
          <SectionHeader
            id="top-gaps"
            index="5"
            title="Konsep dengan Gap Terbanyak"
            meta={topGaps.length ? `${topGaps.length} konsep` : undefined}
          />
          <AnimatedContent>
            {topGaps.length === 0 ? (
              <EmptyState
                title="Belum Ada Data Analytics"
                description="Belum ada data analytics konsep. Data akan terisi seiring peserta mengerjakan asesmen."
              />
            ) : (
              <div
                className={cx("table-cards mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}
              >
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
                        <td className={cx(TD_CLASS, "tabular-nums")} data-label="Jumlah Gap">
                          {g.gap_count}
                        </td>
                        <td className={cx(TD_CLASS, "tabular-nums")} data-label="Jumlah Error">
                          {g.error_count}
                        </td>
                        <td className={cx(TD_CLASS, "tabular-nums")} data-label="Rata-rata Mastery">
                          {g.average_mastery ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AnimatedContent>
        </>
      )}

      <SectionHeader
        id="activity"
        index="6"
        title="Event Belajar"
        meta={activity.events.length ? `${activity.events.length} terbaru` : undefined}
      />
      <AnimatedContent>
        {activity.events.length === 0 ? (
          <EmptyState title="Belum Ada Event Belajar" description="Belum ada event belajar." />
        ) : (
          <div className="mt-4">
            {activity.events.map((ev) => (
              <AccordionRow
                key={ev.id}
                open={openKey === `ev-${ev.id}`}
                onToggle={() => toggleRow(`ev-${ev.id}`)}
                summary={
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className={cx("text-[13px] font-bold", INK)}>{ev.event_type}</span>
                    <span className={cx("text-[12px]", MUTED)}>
                      {formatDateTime(ev.occurred_at)}
                    </span>
                  </span>
                }
                trailing={<MicroMeta>{ev.actor_name || "—"}</MicroMeta>}
              >
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className={DT_CLASS}>Pelaku</dt>
                    <dd className={DD_CLASS}>{ev.actor_name || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className={DT_CLASS}>Entitas</dt>
                    <dd className={DD_CLASS}>{ev.entity_type || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className={DT_CLASS}>Waktu</dt>
                    <dd className={DD_CLASS}>{formatDateTime(ev.occurred_at)}</dd>
                  </div>
                </dl>
              </AccordionRow>
            ))}
          </div>
        )}
      </AnimatedContent>

      <SectionHeader
        id="audit-log"
        index="7"
        title="Audit Log (aksi penting)"
        meta={activity.audits.length ? `${activity.audits.length} terbaru` : undefined}
      />
      <AnimatedContent>
        {activity.audits.length === 0 ? (
          <EmptyState title="Belum Ada Catatan Audit" description="Belum ada catatan audit." />
        ) : (
          <div className="mt-4">
            {activity.audits.map((a) => (
              <AccordionRow
                key={a.id}
                open={openKey === `au-${a.id}`}
                onToggle={() => toggleRow(`au-${a.id}`)}
                summary={
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className={cx("text-[13px] font-bold", INK)}>
                      {ACTION_LABELS[a.action] || a.action}
                    </span>
                    <span className={cx("text-[12px]", MUTED)}>
                      {formatDateTime(a.occurred_at)}
                    </span>
                  </span>
                }
                trailing={<MicroMeta>{a.actor_name || "—"}</MicroMeta>}
              >
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className={DT_CLASS}>Pelaku</dt>
                    <dd className={DD_CLASS}>{a.actor_name || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className={DT_CLASS}>Tipe pelaku</dt>
                    <dd className={DD_CLASS}>{a.actor_type || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className={DT_CLASS}>Entitas</dt>
                    <dd className={DD_CLASS}>{a.entity_type || "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className={DT_CLASS}>Waktu</dt>
                    <dd className={DD_CLASS}>{formatDateTime(a.occurred_at)}</dd>
                  </div>
                </dl>
              </AccordionRow>
            ))}
          </div>
        )}
      </AnimatedContent>
    </PageContainer>
  );
}
