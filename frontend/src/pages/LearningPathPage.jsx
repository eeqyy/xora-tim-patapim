// ============================================================
// XORA — Learning Path (hierarki: level → topik → konsep)
// frontend/src/pages/LearningPathPage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { learningPathApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Meter from "../components/ui/Meter";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { difficultyMeta } from "../lib/statusMaps";
import { formatScore } from "../lib/formatters";

function countNodes(levels) {
  let topics = 0;
  let concepts = 0;
  for (const lvl of levels || []) {
    topics += lvl.topics?.length || 0;
    for (const t of lvl.topics || []) concepts += t.concepts?.length || 0;
  }
  return { levels: levels?.length || 0, topics, concepts };
}

export default function LearningPathPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const path = useAsync(() => learningPathApi.getPath(null, token), [token]);

  const data = path.data;
  const stats = data ? countNodes(data.levels) : null;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Learning Path"
        title={data?.subject?.name || "Learning Path"}
        desc={data?.subject?.description}
        actions={
          stats && (
            <>
              <Badge variant="outline">{stats.levels} level</Badge>
              <Badge variant="outline">{stats.topics} topik</Badge>
              <Badge variant="outline">{stats.concepts} konsep</Badge>
            </>
          )
        }
      />

      {path.error ? (
        <ErrorState message="Gagal memuat learning path." detail={path.error.message} onRetry={path.run} />
      ) : path.loading ? (
        <SkeletonList count={4} variant="card" />
      ) : !data || !data.levels || data.levels.length === 0 ? (
        <Card>
          <div className="ui-empty">
            <div className="ui-empty-title">Belum ada jalur untuk subject ini</div>
            <div className="ui-empty-desc">
              Hubungi admin untuk melengkapi kurikulum, atau mulai dari asesmen yang tersedia.
            </div>
          </div>
        </Card>
      ) : (
        <div className="ui-lp">
          {data.levels.map((level) => {
            const diff = difficultyMeta(level.difficulty);
            return (
              <section key={level.id} className="ui-lp-level">
                <div className="ui-lp-level-head">
                  <div className="ui-lp-level-title">
                    <span className="ui-lp-level-order ui-mono">{String(level.order_index ?? "").padStart(2, "0")}</span>
                    <h2 className="ui-lp-level-name">{level.name}</h2>
                  </div>
                  <div className="ui-lp-level-meta">
                    <Badge variant={diff.tone} dot>
                      {diff.label}
                    </Badge>
                    <span className="ui-mono ui-dim">
                      {level.topics?.length || 0} topik
                    </span>
                  </div>
                </div>

                {level.topics?.length ? (
                  <div className="ui-lp-topics">
                    {level.topics.map((topic) => (
                      <Card key={topic.id} className="ui-lp-topic">
                        <div className="ui-lp-topic-name">{topic.name}</div>
                        {topic.description && <div className="ui-lp-topic-desc">{topic.description}</div>}
                        {topic.concepts?.length ? (
                          <div className="ui-lp-concepts">
                            {topic.concepts.map((concept) => (
                              <button
                                key={concept.id}
                                type="button"
                                className="ui-lp-concept"
                                onClick={() => navigate(`/mastery/${concept.id}`)}
                              >
                                <div className="ui-lp-concept-main">
                                  <span className="ui-lp-concept-name">{concept.name}</span>
                                  {concept.is_locked && (
                                    <span className="ui-lp-lock" title="Prasyarat belum dikuasai">
                                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                      </svg>
                                      prasyarat
                                    </span>
                                  )}
                                </div>
                                <Meter
                                  value={Number(concept.mastery_score) || 0}
                                  display={concept.mastery_score == null ? "belum dinilai" : formatScore(concept.mastery_score)}
                                  tone={
                                    concept.is_mastered
                                      ? "success"
                                      : concept.gap_status === "CONFIRMED"
                                        ? "error"
                                        : concept.mastery_score == null
                                          ? ""
                                          : "warning"
                                  }
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="ui-mono ui-dim">Belum ada konsep</div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="ui-mono ui-dim">Belum ada topik pada level ini</div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}