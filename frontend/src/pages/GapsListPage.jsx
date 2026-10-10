// ============================================================
// XORA — Gap List
// frontend/src/pages/GapsListPage.jsx
// ============================================================

import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { gapsApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import StatusPill from "../components/ui/StatusPill";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import { formatDate, formatScore } from "../lib/formatters";

const CONFIRMED = new Set(["CONFIRMED"]);

export default function GapsListPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const gaps = useAsync(() => gapsApi.list(token), [token]);

  const rows = useMemo(() => (Array.isArray(gaps.data) ? gaps.data : []), [gaps.data]);
  const confirmed = rows.filter((r) => CONFIRMED.has(r.gap_status)).length;
  const verifying = rows.filter((r) => r.gap_status === "VERIFICATION" || r.diagnostic_status === "HYPOTHESIS").length;

  const columns = [
    { key: "concept_name", label: "Konsep", strong: true },
    { key: "status", label: "Status" },
    { key: "mastery", label: "Mastery", align: "right" },
    { key: "confidence", label: "Confidence", align: "right" },
    { key: "evidence", label: "Bukti", align: "right" },
    { key: "assessed", label: "Dinilai" },
  ];

  const tableRows = rows.map((r) => ({
    concept_name: r.concept_name,
    status: <StatusPill kind="gap" status={r.gap_status} />,
    mastery: <span className="ui-num">{formatScore(r.mastery_score)}</span>,
    confidence: <span className="ui-num">{formatScore(r.evidence_confidence)}</span>,
    evidence: <span className="ui-num">{r.evidence_count}</span>,
    assessed: formatDate(r.last_assessed_at),
    _conceptId: r.concept_id,
  }));

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Diagnostics"
        title="Gap Aktif"
        desc="Konsep yang perlu dikuatkan berdasarkan bukti, diurutkan dari mastery terendah. Klik baris untuk detail, root cause, dan aksi."
      />

      <div className="ui-stat-grid">
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{rows.length}</span>
          <span className="ui-eyebrow">Gap aktif</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum err">{confirmed}</span>
          <span className="ui-eyebrow">Terverifikasi</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum warn">{verifying}</span>
          <span className="ui-eyebrow">Menunggu verifikasi</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">
            {rows.filter((r) => r.actions && r.actions.length > 0).length}
          </span>
          <span className="ui-eyebrow">Dengan rekomendasi</span>
        </Card>
      </div>

      <DataTable
        columns={columns}
        rows={tableRows}
        loading={gaps.loading}
        rowKey={(row) => row._conceptId}
        onRowClick={(row) => navigate(`/gaps/${row._conceptId}`)}
        empty={
          <Card>
            <div className="ui-empty">
              <div className="ui-empty-title">Tidak ada gap aktif</div>
              <div className="ui-empty-desc">
                Konsep yang dipetakan belum terlihat bermasalah. Lanjutkan latihan atau lakukan asesmen untuk membuktikan mastery.
              </div>
              <div className="ui-empty-action">
                <Button to="/assessments">Mulai Asesmen</Button>
              </div>
            </div>
          </Card>
        }
      />
    </div>
  );
}