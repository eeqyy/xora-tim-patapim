// ============================================================
// XORA — Practice List (bank latihan non-graded)
// frontend/src/pages/PracticeListPage.jsx
// ============================================================

import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { practicesApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { formatScore } from "../lib/formatters";

export default function PracticeListPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const practices = useAsync(() => practicesApi.list({}, token), [token]);
  const [busy, setBusy] = useState(null);
  const [startError, setStartError] = useState(null);

  const items = Array.isArray(practices.data) ? practices.data : [];
  const totalSoal = useMemo(
    () => items.reduce((sum, p) => sum + (Number(p.question_count) || 0), 0),
    [items]
  );

  const startPractice = async (item) => {
    setStartError(null);
    setBusy(item.id);
    try {
      const res = await practicesApi.start(item.id, token);
      const assessmentId = res?.data?.attempt?.assessment_id;
      if (assessmentId) navigate(`/assessments/${assessmentId}`);
      else navigate("/assessments");
    } catch (err) {
      setStartError(err?.message || "Gagal memulai latihan.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Latihan"
        title="Bank Latihan"
        desc="Latihan non-graded untuk menutup gap konsep. Tanpa batas percobaan — kelola di rekomendasi, lalu buktikan mastery lewat asesmen."
      />

      <div className="ui-stat-grid">
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{items.length}</span>
          <span className="ui-eyebrow">Total latihan</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{totalSoal}</span>
          <span className="ui-eyebrow">Total soal</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">∞</span>
          <span className="ui-eyebrow">Tanpa batas percobaan</span>
        </Card>
      </div>

      {startError && (
        <ErrorState message="Gagal memulai latihan." detail={startError} />
      )}

      {practices.error ? (
        <ErrorState message="Gagal memuat latihan." detail={practices.error.message} onRetry={practices.run} />
      ) : practices.loading ? (
        <SkeletonList count={4} variant="card" />
      ) : items.length === 0 ? (
        <Card>
          <div className="ui-empty">
            <div className="ui-empty-title">Belum ada latihan</div>
            <div className="ui-empty-desc">Latihan berjenis PRACTICE akan tampil di sini.</div>
          </div>
        </Card>
      ) : (
        <div className="ui-material-list">
          {items.map((item) => (
            <Card key={item.id} className="ui-material">
              <div className="ui-material-meta">
                <Badge variant="outline">PRACTICE</Badge>
                {item.subject_name && <Badge variant="neutral">{item.subject_name}</Badge>}
              </div>
              <div className="ui-material-title">{item.title}</div>
              <div className="ui-material-meta">
                {item.topic_name && <span className="ui-dim">{item.topic_name}</span>}
                {item.level_name && <span className="ui-dim">{item.level_name}</span>}
                <span className="ui-dim">{item.question_count} soal</span>
                <span className="ui-dim">
                  {item.duration_minutes ? `${item.duration_minutes} menit` : "Fleksibel"}
                </span>
                <span className="ui-dim">KKM {formatScore(item.passing_score)}</span>
              </div>
              <div className="ui-action-btns">
                <Button
                  size="sm"
                  onClick={() => startPractice(item)}
                  loading={busy === item.id}
                  aria-label={`Mulai latihan ${item.title}`}
                >
                  Mulai
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="ui-page-desc">Setelah dikerjakan, hasil latihan tampil di halaman hasil asesmen.</p>
    </div>
  );
}
