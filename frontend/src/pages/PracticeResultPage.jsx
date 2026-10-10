// ============================================================
// XORA — Practice Result (hasil latihan + review bukti)
// frontend/src/pages/PracticeResultPage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { practicesApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import StatusPill from "../components/ui/StatusPill";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { formatScore, formatDate } from "../lib/formatters";
import { actionTypeMeta, actionStatusMeta } from "../lib/statusMaps";

const GAP_OPEN = new Set(["POSSIBLE_GAP", "VERIFICATION", "INCONCLUSIVE", "IN_PRACTICE", "CONFIRMED"]);

export default function PracticeResultPage({ attemptId }) {
  const { token } = useAuth();
  const { navigate } = useRouter();

  const query = useAsync(
    () => (attemptId ? practicesApi.getResult(attemptId, token) : Promise.resolve(null)),
    [attemptId, token]
  );

  if (query.loading) {
    return (
      <div className="page-container">
        <SkeletonList count={4} variant="card" />
      </div>
    );
  }

  const result = query.data?.data ?? query.data;
  const attempt = result?.attempt;

  if (query.error || !attempt) {
    return (
      <div className="page-container">
        <Card>
          <ErrorState
            message={query.error?.message || "Hasil latihan tidak dapat ditampilkan."}
            onRetry={query.run}
          />
        </Card>
        <div className="ui-pair">
          <Button to="/practices" variant="ghost">
            ← Daftar Latihan
          </Button>
        </div>
      </div>
    );
  }

  const scoreNum = Math.round(Number(attempt.score) || 0);
  const passingScoreNum = Math.round(Number(attempt.passing_score) || 70);
  const isPassed = attempt.passed ?? scoreNum >= passingScoreNum;
  const evidence = Array.isArray(result.evidence) ? result.evidence : [];
  const concepts = Array.isArray(result.concepts) ? result.concepts : [];
  const recommendation = result.recommendation || null;

  const conceptById = {};
  concepts.forEach((c) => {
    conceptById[c.concept_id] = c;
  });

  const descParts = [];
  if (attempt.subject_name) descParts.push(`Mata pelajaran: ${attempt.subject_name}`);
  if (attempt.completed_at) descParts.push(`Selesai: ${formatDate(attempt.completed_at)}`);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Latihan Selesai"
        title={attempt.assessment_title || "Hasil Latihan"}
        desc={descParts.length ? descParts.join(" · ") : undefined}
        backLabel="Kembali ke Latihan"
        onBack={() => navigate("/practices")}
        actions={
          <Badge variant={isPassed ? "success" : "error"} dot>
            POIN {scoreNum}%
          </Badge>
        }
      />

      <Card className="ui-result-banner" elevated>
        <div className="ui-result-score">
          <div className="ui-result-score-value ui-num">{scoreNum}%</div>
          <div className="ui-eyebrow">Skor latihan</div>
        </div>
        <div className="ui-result-verdict">
          <Badge variant={isPassed ? "success" : "error"} dot>
            {isPassed ? "TUNTAS" : "BELUM TUNTAS"}
          </Badge>
          <p className="ui-result-note">
            Bukti tiap soal sudah tercatat dan memperbarui mastery konsep terkait.
          </p>
        </div>
      </Card>

      <section className="ui-section">
        <div className="ui-section-head">
          <h2 className="ui-section-title">Per Soal</h2>
          <span className="ui-mono ui-dim">{evidence.length} bukti tercatat</span>
        </div>
        <Card>
          {evidence.length === 0 ? (
            <div className="ui-mono ui-dim">Belum ada bukti per soal.</div>
          ) : (
            evidence.map((e) => {
              const concept = conceptById[e.concept_id];
              const isGap = concept && GAP_OPEN.has(concept.gap_status);
              return (
                <div key={e.id} className="ui-gap-pattern-row">
                  <div className="ui-gap-rc" style={{ flex: 1, minWidth: 0 }}>
                    <div className="ui-mono ui-dim">
                      {e.concept_name || "–"}
                      {isGap && (
                        <>
                          {" "}
                          <StatusPill kind="gap" status={concept.gap_status} />
                        </>
                      )}
                    </div>
                    <div>{e.question_text}</div>
                    {e.error_pattern && (
                      <div>
                        <Badge variant="warning">{e.error_pattern}</Badge>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <Badge variant={e.is_correct ? "success" : "error"} dot>
                      {e.is_correct ? "Benar" : "Salah"}
                    </Badge>
                    <span className="ui-mono ui-dim">{formatScore(e.score)}</span>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </section>

      {concepts.length > 0 && (
        <section className="ui-section">
          <div className="ui-section-head">
            <h2 className="ui-section-title">Konsep Terkait</h2>
          </div>
          <div className="ui-action-list">
            {concepts.map((c) => (
              <Card
                key={c.concept_id}
                className="ui-action"
                hoverable
                role="button"
                tabIndex={0}
                aria-label={`Lihat mastery ${c.concept_name}`}
                onClick={() => navigate(`/mastery/${c.concept_id}`)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    navigate(`/mastery/${c.concept_id}`);
                  }
                }}
              >
                <div className="ui-gap-rc">
                  <div className="ui-gap-rc-name">{c.concept_name}</div>
                  <MeterScore value={c.mastery_score} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <StatusPill kind="gap" status={c.gap_status} />
                    <span className="ui-mono ui-dim">{c.evidence_count} bukti</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="ui-section">
        <div className="ui-section-head">
          <h2 className="ui-section-title">Rekomendasi</h2>
        </div>
        {recommendation ? (
          <Card className="ui-action">
            <div className="ui-action-head">
              <Badge variant={actionTypeMeta(recommendation.action_type).tone} dot>
                {actionTypeMeta(recommendation.action_type).label}
              </Badge>
              <Badge variant={actionStatusMeta(recommendation.status).tone} dot>
                {actionStatusMeta(recommendation.status).label}
              </Badge>
            </div>
            <p className="ui-action-reason">Masih ada rekomendasi untuk konsep ini.</p>
            <div className="ui-action-btns">
              <Button to="/recommendations" size="sm">
                Ke Rekomendasi
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="ui-mono ui-dim">Belum ada rekomendasi baru — lanjut latihan lain.</div>
          </Card>
        )}
      </section>

      <div className="ui-pair">
        <Button to="/practices" variant="ghost">
          ← Daftar Latihan
        </Button>
        <Button to="/assessments">Asesmen</Button>
      </div>
    </div>
  );
}

function MeterScore({ value }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const tone = safe >= 80 ? "success" : safe >= 50 ? "warning" : "error";
  return (
    <div
      className="ui-meter ui-meter-inline"
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="ui-meter-track">
        <div className={`ui-meter-fill ui-meter-fill-${tone}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}
