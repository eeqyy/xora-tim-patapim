// ============================================================
// XORA — Dashboard (learner)
// Ringkasan: langkah berikutnya + mastery + akses cepat.
// frontend/src/pages/DashboardPage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { masteryApi, recommendationsApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Meter from "../components/ui/Meter";
import StatusPill from "../components/ui/StatusPill";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { actionTypeMeta } from "../lib/statusMaps";
import { formatTimeAgo, formatScore } from "../lib/formatters";

const GAP_IN_PROGRESS = new Set(["POSSIBLE_GAP", "VERIFICATION", "INCONCLUSIVE", "IN_PRACTICE"]);

export default function DashboardPage() {
  const { token, user } = useAuth();
  const { navigate } = useRouter();

  const mastery = useAsync(() => masteryApi.getSummary(token), [token]);
  const next = useAsync(() => recommendationsApi.getNextStep(token), [token]);

  const rows = mastery.data || [];
  const mastered = rows.filter((r) => r.gap_status === "MASTERED" || r.mastery_score >= 80);
  const gapsOpen = rows.filter((r) => GAP_IN_PROGRESS.has(r.gap_status));
  const avgScore = rows.length ? rows.reduce((a, r) => a + (Number(r.mastery_score) || 0), 0) / rows.length : null;

  const action = next.data || null;
  const actionMeta = action ? actionTypeMeta(action.action_type) : null;

  const handleStart = async () => {
    if (!action) return;
    try {
      const res = await recommendationsApi.start(action.id, token);
      const attemptId = res?.data?.attempt?.id;
      if (attemptId) navigate(`/attempts/${attemptId}`);
      else navigate("/assessments");
    } catch (err) {
      navigate("/assessments");
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Dashboard"
        title={`Halo, ${user?.name || "pembelajar"}`}
        desc="Ringkasan posisi belajarmu dan langkah berikutnya yang direkomendasikan."
        actions={
          <>
            <Button to="/assessments" variant="ghost" size="sm">
              Asesmen
            </Button>
            <Button to="/learning-path" variant="ghost" size="sm">
              Learning Path
            </Button>
          </>
        }
      />

      <div className="ui-stat-grid">
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{avgScore !== null ? formatScore(avgScore) : "–"}</span>
          <span className="ui-eyebrow">Mastery rata-rata</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum ok">{mastered.length}</span>
          <span className="ui-eyebrow">Konsep dikuasai</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum warn">{gapsOpen.length}</span>
          <span className="ui-eyebrow">Gap menunggu</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{rows.length}</span>
          <span className="ui-eyebrow">Konsep dinilai</span>
        </Card>
      </div>

      <section className="ui-section">
        <div className="ui-section-head">
          <h2 className="ui-section-title">Langkah Berikutnya</h2>
        </div>

        {next.error ? (
          <ErrorState message="Gagal memuat rekomendasi." detail={next.error.message} onRetry={next.run} />
        ) : next.loading ? (
          <SkeletonList count={2} variant="card" />
        ) : action ? (
          <Card elevated>
            <div className="ui-next-head">
              <div className="ui-next-concept">{action.concept_name}</div>
              {action.gap_concept_id && action.gap_concept_name && (
                <Badge variant="outline">gap: {action.gap_concept_name}</Badge>
              )}
            </div>
            {actionMeta && (
              <div className="ui-next-meta">
                <Badge variant={actionMeta.tone} dot>
                  {actionMeta.label}
                </Badge>
                {action.priority !== undefined && action.priority !== null && (
                  <span className="ui-mono ui-dim">prioritas {action.priority}</span>
                )}
              </div>
            )}
            {action.reason && <p className="ui-next-reason">{action.reason}</p>}
            <div className="ui-next-actions">
              <Button onClick={handleStart} size="sm">
                Mulai
              </Button>
              <Button to="/assessments" variant="ghost" size="sm">
                Cari di Asesmen
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="ui-empty">
              <div className="ui-empty-title">Belum ada langkah aktif</div>
              <div className="ui-empty-desc">
                Mulai dengan asesmen awal — learning map dan rekomendasi akan muncul otomatis.
              </div>
              <div className="ui-empty-action">
                <Button to="/assessments">Mulai Asesmen</Button>
              </div>
            </div>
          </Card>
        )}
      </section>

      <section className="ui-section">
        <div className="ui-section-head">
          <h2 className="ui-section-title">Penilaian Konsep</h2>
          <Button to="/mastery" variant="subtle" size="sm">
            Buka Mastery
          </Button>
        </div>

        {mastery.error ? (
          <ErrorState message="Gagal memuat mastery." detail={mastery.error.message} onRetry={mastery.run} />
        ) : mastery.loading ? (
          <SkeletonList count={4} variant="table-row" />
        ) : rows.length === 0 ? (
          <Card>
            <div className="ui-empty">
              <div className="ui-empty-title">Belum ada penilaian</div>
              <div className="ui-empty-desc">Konsep akan dinilai setelah kamu mengerjakan asesmen atau latihan.</div>
            </div>
          </Card>
        ) : (
          rows.slice(0, 5).map((r) => (
            <Card key={r.concept_id} className="ui-mastery-row" hoverable onClick={() => navigate(`/mastery/${r.concept_id}`)}>
              <div className="ui-mastery-row-main">
                <div className="ui-mastery-row-name">{r.concept}</div>
                <Meter
                  value={Number(r.mastery_score) || 0}
                  display={formatScore(r.mastery_score)}
                  tone={r.gap_status === "MASTERED" ? "success" : r.gap_status === "CONFIRMED" ? "error" : "warning"}
                />
              </div>
              <StatusPill kind="gap" status={r.gap_status} />
              <div className="ui-mono ui-dim ui-mastery-row-meta">
                {r.evidence_count} bukti · {formatTimeAgo(r.last_assessed_at)}
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}