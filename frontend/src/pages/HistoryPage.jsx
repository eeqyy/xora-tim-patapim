// ============================================================
// XORA — Riwayat Aktivitas Belajar
// frontend/src/pages/HistoryPage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { historyApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import StatusPill from "../components/ui/StatusPill";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { formatScore, formatDate } from "../lib/formatters";

const EVENT_LABELS = {
  ASSESSMENT_STARTED: "Mulai Asesmen",
  ASSESSMENT_COMPLETED: "Selesaikan Asesmen",
  PRACTICE_STARTED: "Mulai Latihan",
  PRACTICE_COMPLETED: "Selesaikan Latihan",
  DIAGNOSTIC_VERIFIED: "Diagnostic Terverifikasi",
  RECOMMENDATION_COMPLETED: "Rekomendasi Selesai",
  REASSESSMENT_COMPLETED: "Uji Ulang Selesai",
  LEARNING_PATH_UPDATED: "Learning Path Diperbarui",
};

const TYPE_LABELS = {
  PRACTICE: "Latihan",
  TOPIC: "Topik",
  LEVEL_FINAL: "Level Final",
};

const STATUS_LABELS = {
  IN_PROGRESS: "Berjalan",
  COMPLETED: "Selesai",
};

const eventLabel = (t) => EVENT_LABELS[t] || t;
const typeLabel = (t) => TYPE_LABELS[t] || t || "Asesmen";
const statusLabel = (s) => STATUS_LABELS[s] || s || "-";
const statusVariant = (s) => (s === "COMPLETED" ? "success" : s === "IN_PROGRESS" ? "indigo" : "neutral");

export default function HistoryPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const history = useAsync(() => historyApi.getHistory({ limit: 50 }, token), [token]);

  const res = history.data;
  const payload = res?.data ?? res;
  const summary = payload?.summary || {};
  const attempts = Array.isArray(payload?.recent_attempts) ? payload.recent_attempts : [];
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const pagination = payload?.pagination || null;

  const openAttempt = (id) => navigate(`/attempts/${id}`);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Riwayat"
        title="Aktivitas Belajar"
        desc="Timeline event, ringkasan attempt, dan statistik konsep."
      />

      {history.error ? (
        <Card>
          <ErrorState message="Gagal memuat riwayat." detail={history.error.message} onRetry={history.run} />
        </Card>
      ) : history.loading ? (
        <SkeletonList count={4} variant="card" />
      ) : (
        <>
          <div className="ui-stat-grid">
            <Card className="ui-stat">
              <span className="ui-stat-num ui-num ui-tnum">{summary.completed_attempts ?? 0}</span>
              <span className="ui-eyebrow">Attempt selesai</span>
            </Card>
            <Card className="ui-stat">
              <span className="ui-stat-num ui-num ui-tnum">
                {summary.average_score == null ? "–" : formatScore(summary.average_score)}
              </span>
              <span className="ui-eyebrow">Rata-rata skor</span>
            </Card>
            <Card className="ui-stat">
              <span className="ui-stat-num ui-num ui-tnum ok">{summary.mastered_concepts ?? 0}</span>
              <span className="ui-eyebrow">Konsep mastered</span>
            </Card>
            <Card className="ui-stat">
              <span className="ui-stat-num ui-num ui-tnum warn">{summary.active_gaps ?? 0}</span>
              <span className="ui-eyebrow">Gap aktif</span>
            </Card>
          </div>

          <section className="ui-section">
            <div className="ui-section-head">
              <h2 className="ui-section-title">Terakhir Dikerjakan</h2>
            </div>

            {attempts.length === 0 ? (
              <Card>
                <div className="ui-empty">
                  <div className="ui-empty-title">Belum ada attempt</div>
                  <div className="ui-empty-desc">
                    Selesaikan asesmen atau latihan untuk melihat riwayatnya di sini.
                  </div>
                  <div className="ui-empty-action">
                    <Button to="/assessments">Mulai Asesmen</Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="ui-action-list">
                {attempts.slice(0, 5).map((a) => (
                  <Card
                    key={a.id}
                    className="ui-mastery-row"
                    hoverable
                    role="link"
                    tabIndex={0}
                    aria-label={`Buka hasil: ${a.title || "attempt"}`}
                    onClick={() => openAttempt(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openAttempt(a.id);
                      }
                    }}
                  >
                    <div className="ui-mastery-row-main">
                      <div className="ui-mastery-row-name">{a.title || "Attempt"}</div>
                      <div className="ui-mono ui-dim ui-mastery-row-meta">{formatDate(a.started_at)}</div>
                    </div>
                    <Badge variant="neutral">{typeLabel(a.type)}</Badge>
                    <Badge variant={statusVariant(a.status)} dot>
                      {statusLabel(a.status)}
                    </Badge>
                    <span className="ui-num">{formatScore(a.score)}</span>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="ui-section">
            <div className="ui-section-head">
              <h2 className="ui-section-title">Timeline</h2>
            </div>

            {events.length === 0 ? (
              <Card>
                <div className="ui-empty">
                  <div className="ui-empty-title">Belum ada aktivitas</div>
                  <div className="ui-empty-desc">Event belajar akan tercatat di sini seiring kamu berlatih.</div>
                </div>
              </Card>
            ) : (
              <Card>
                {events.map((ev) => (
                  <div key={ev.id} className="ui-gap-pattern-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                      <Badge variant="neutral" dot>
                        {eventLabel(ev.event_type)}
                      </Badge>
                      <span className="ui-mono ui-dim">{ev.entity_type}</span>
                      {ev.metadata?.title && <span className="ui-dim">{ev.metadata.title}</span>}
                    </div>
                    <span className="ui-mono ui-dim">{formatDate(ev.occurred_at)}</span>
                  </div>
                ))}
              </Card>
            )}

            {pagination && pagination.total > events.length && (
              <div className="ui-mono ui-dim" style={{ marginTop: 10, fontSize: 12 }}>
                Timeline terbatas pada 50 event terbaru.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
