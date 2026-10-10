// ============================================================
// XORA — Assessment List (daftar asesmen + filter tipe)
// frontend/src/pages/AssessmentListPage.jsx
// ============================================================

import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { assessmentsApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import {
  ASSESSMENT_TYPE_LABELS,
  assessmentTypeMeta,
  labelOf,
} from "../lib/statusMaps";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";

const TYPE_FILTERS = ["ALL", "TOPIC", "LEVEL_FINAL", "PRACTICE"];

export default function AssessmentListPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const assessments = useAsync(() => assessmentsApi.getAll({}, token), [token]);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const allItems = useMemo(() => (Array.isArray(assessments.data) ? assessments.data : []), [assessments.data]);
  const items = useMemo(
    () => (typeFilter === "ALL" ? allItems : allItems.filter((a) => a.type === typeFilter)),
    [allItems, typeFilter]
  );

  const countLabel = (type) => (type === "ALL" ? allItems.length : allItems.filter((a) => a.type === type).length);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Asesmen"
        title="Kumpulkan bukti pemahaman"
        desc="Pilih asesmen di bawah untuk mengukur pemahamanmu. Hasilnya dievaluasi objektif dan menjadi bukti mastery."
      />

      <div className="ui-chip-row" role="group" aria-label="Filter tipe asesmen">
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            type="button"
            className={`ui-chip ${typeFilter === type ? "ui-chip-active" : ""}`}
            onClick={() => setTypeFilter(type)}
          >
            {type === "ALL" ? "Semua" : labelOf(ASSESSMENT_TYPE_LABELS, type)}
            <span className="ui-mono ui-dim">{countLabel(type)}</span>
          </button>
        ))}
      </div>

      {assessments.error ? (
        <ErrorState message="Gagal memuat daftar asesmen." detail={assessments.error.message} onRetry={assessments.run} />
      ) : assessments.loading ? (
        <SkeletonList count={4} variant="card" />
      ) : items.length === 0 ? (
        <Card>
          <div className="ui-empty">
            <div className="ui-empty-title">Tidak ada asesmen pada kategori ini</div>
            <div className="ui-empty-desc">Coba pindahkan filter, atau minta admin menambahkan asesmen baru.</div>
          </div>
        </Card>
      ) : (
        <div className="ui-assess-grid">
          {items.map((item) => {
            const meta = assessmentTypeMeta(item.type);
            return (
              <Card key={item.id} className="ui-assess-card" hoverable onClick={() => navigate(`/assessments/${item.id}`)}>
                <div className="ui-assess-card-top">
                  <Badge variant={meta.tone} dot>
                    {meta.label}
                  </Badge>
                  {item.subject_name && <span className="ui-dim ui-assess-subject">{item.subject_name}</span>}
                </div>
                <h2 className="ui-assess-title">{item.title}</h2>

                <div className="ui-assess-meta">
                  {item.level_name && (
                    <div className="ui-kv">
                      <span className="ui-kv-label">Level</span>
                      <span className="ui-kv-value">{item.level_name}</span>
                    </div>
                  )}
                  {item.topic_name && (
                    <div className="ui-kv">
                      <span className="ui-kv-label">Topik</span>
                      <span className="ui-kv-value">{item.topic_name}</span>
                    </div>
                  )}
                  <div className="ui-kv">
                    <span className="ui-kv-label">Soal</span>
                    <span className="ui-kv-value ui-num">{item.question_count}</span>
                  </div>
                  <div className="ui-kv">
                    <span className="ui-kv-label">Durasi</span>
                    <span className="ui-kv-value">{item.duration_minutes ? `${item.duration_minutes} mnt` : "Fleksibel"}</span>
                  </div>
                </div>

                <div className="ui-assess-card-actions">
                  <Button to={`/assessments/${item.id}`} size="sm">
                    Mulai →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}