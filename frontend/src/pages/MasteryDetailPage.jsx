// ============================================================
// XORA — Detail Mastery satu konsep
// frontend/src/pages/MasteryDetailPage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { masteryApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Meter from "../components/ui/Meter";
import StatusPill from "../components/ui/StatusPill";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { formatDate, formatScore } from "../lib/formatters";

export default function MasteryDetailPage({ params }) {
  const conceptId = params?.conceptId;
  const { token } = useAuth();
  const { navigate } = useRouter();
  const detail = useAsync(() => masteryApi.getConceptMastery(conceptId, token), [conceptId, token]);

  const d = detail.data;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Mastery · Detail Konsep"
        title={detail.loading ? "Memuat…" : d?.concept || "Konsep"}
        backLabel="Kembali ke Mastery"
        onBack={() => navigate("/mastery")}
      />

      {detail.error ? (
        <ErrorState message="Gagal memuat detail konsep." detail={detail.error.message} onRetry={detail.run} />
      ) : detail.loading ? (
        <SkeletonList count={4} variant="card" />
      ) : !d ? (
        <Card>
          <div className="ui-empty">
            <div className="ui-empty-title">Belum ada data mastery</div>
            <div className="ui-empty-desc">Konsep ini belum dinilai untuk akunmu.</div>
            <div className="ui-empty-action">
              <Button to="/assessments">Mulai Asesmen</Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card className="ui-mastery-detail">
            <div className="ui-mastery-detail-top">
              <h2 className="ui-mastery-detail-name">{d.concept}</h2>
              <StatusPill kind="gap" status={d.gap_status} />
            </div>
            <Meter
              label="Mastery score"
              value={Number(d.mastery_score) || 0}
              display={formatScore(d.mastery_score)}
              tone={
                d.gap_status === "MASTERED"
                  ? "success"
                  : d.gap_status === "CONFIRMED"
                    ? "error"
                    : d.mastery_score == null
                      ? ""
                      : "warning"
              }
            />
            <div className="ui-mastery-detail-grid">
              <div className="ui-kv">
                <span className="ui-kv-label">Confidence</span>
                <span className="ui-kv-value ui-num">{formatScore(d.evidence_confidence)}</span>
              </div>
              <div className="ui-kv">
                <span className="ui-kv-label">Jumlah bukti</span>
                <span className="ui-kv-value ui-num">{d.evidence_count}</span>
              </div>
              <div className="ui-kv">
                <span className="ui-kv-label">Pola error utama</span>
                <span className="ui-kv-value">{d.primary_error_pattern || "–"}</span>
              </div>
              <div className="ui-kv">
                <span className="ui-kv-label">Terakhir dinilai</span>
                <span className="ui-kv-value">{formatDate(d.last_assessed_at)}</span>
              </div>
            </div>
          </Card>

          <div className="ui-pair">
            <Button to="/learning-path" variant="subtle">
              Lihat Learning Path
            </Button>
            <Button to="/assessments">Latihan / Asesmen</Button>
          </div>
        </>
      )}
    </div>
  );
}