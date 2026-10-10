// ============================================================
// XORA — Mastery (ringkasan status seluruh konsep)
// frontend/src/pages/MasteryPage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { masteryApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import StatusPill from "../components/ui/StatusPill";
import DataTable from "../components/ui/DataTable";
import Button from "../components/ui/Button";
import { formatDate, formatScore } from "../lib/formatters";

const GAP_OPEN = new Set(["POSSIBLE_GAP", "VERIFICATION", "INCONCLUSIVE", "IN_PRACTICE", "CONFIRMED"]);

export default function MasteryPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const mastery = useAsync(() => masteryApi.getSummary(token), [token]);

  const rows = Array.isArray(mastery.data) ? mastery.data : [];
  const mastered = rows.filter((r) => r.gap_status === "MASTERED" || r.mastery_score >= 80).length;
  const gaps = rows.filter((r) => GAP_OPEN.has(r.gap_status)).length;
  const avg = rows.length ? rows.reduce((a, r) => a + (Number(r.mastery_score) || 0), 0) / rows.length : null;

  const columns = [
    { key: "concept", label: "Konsep", strong: true },
    { key: "status", label: "Status" },
    { key: "score", label: "Mastery", align: "right" },
    { key: "confidence", label: "Confidence", align: "right" },
    { key: "evidence", label: "Bukti", align: "right" },
    { key: "updated", label: "Dinilai" },
  ];

  const tableRows = rows.map((r) => ({
    concept: r.concept,
    status: <StatusPill kind="gap" status={r.gap_status} />,
    score: <span className="ui-num">{formatScore(r.mastery_score)}</span>,
    confidence: <span className="ui-num">{formatScore(r.evidence_confidence)}</span>,
    evidence: <span className="ui-num">{r.evidence_count}</span>,
    updated: formatDate(r.last_assessed_at),
    _conceptId: r.concept_id,
  }));

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Mastery"
        title="Status Konsep"
        desc="Mastery score, confidence, dan status gap untuk setiap konsep yang sudah dinilai."
        actions={
          <Button to="/assessments" size="sm">
            Asesmen Baru
          </Button>
        }
      />

      <div className="ui-stat-grid">
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{avg !== null ? formatScore(avg) : "–"}</span>
          <span className="ui-eyebrow">Mastery rata-rata</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum ok">{mastered}</span>
          <span className="ui-eyebrow">Dikuasai</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum warn">{gaps}</span>
          <span className="ui-eyebrow">Gap terbuka</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{rows.length}</span>
          <span className="ui-eyebrow">Dinilai</span>
        </Card>
      </div>

      <DataTable
        columns={columns}
        rows={tableRows}
        loading={mastery.loading}
        rowKey={(row) => row._conceptId}
        onRowClick={(row) => navigate(`/mastery/${row._conceptId}`)}
        empty={
          <Card>
            <div className="ui-empty">
              <div className="ui-empty-title">Belum ada data mastery</div>
              <div className="ui-empty-desc">
                Selesaikan asesmen atau latihan untuk mulai memetakan pemahamanmu.
              </div>
              <div className="ui-empty-action">
                <Button to="/assessments">Mulai Asesmen</Button>
              </div>
            </div>
          </Card>
        }
        className="ui-table-clickable"
      />
    </div>
  );
}