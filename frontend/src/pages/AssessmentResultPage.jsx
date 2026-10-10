// ============================================================
// XORA — Assessment Result (rekapitulasi hasil)
// frontend/src/pages/AssessmentResultPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { assessmentsApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Meter from "../components/ui/Meter";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";

export default function AssessmentResultPage({ attemptId }) {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResult() {
      if (!attemptId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await assessmentsApi.getAttempt(attemptId, token);
        if (!res?.data) throw new Error("Data hasil attempt tidak ditemukan.");
        setResult(res.data);
      } catch (err) {
        setError(err.message || "Gagal memuat hasil asesmen.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchResult();
  }, [attemptId, token]);

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonList count={4} variant="card" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="page-container">
        <Card>
          <ErrorState message={error || "Hasil asesmen tidak dapat ditampilkan."} onRetry={() => window.location.reload()} />
        </Card>
        <div className="ui-pair">
          <Button to="/assessments" variant="subtle">
            ← Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const scoreNum = Math.round(Number(result.score) || 0);
  const passingScoreNum = Math.round(Number(result.passing_score) || 70);
  const isPassed = result.passed ?? scoreNum >= passingScoreNum;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Asesmen Selesai"
        title={result.assessment_title || "Hasil Asesmen"}
        desc={result.subject_name ? `Mata pelajaran: ${result.subject_name}` : undefined}
        actions={
          <Badge variant={isPassed ? "success" : "error"} dot>
            {isPassed ? "LULUS" : "BELUM LULUS"}
          </Badge>
        }
      />

      <Card className="ui-result-banner" elevated>
        <div className="ui-result-score">
          <div className="ui-result-score-value ui-num">{scoreNum}%</div>
          <div className="ui-eyebrow">Skor akhir</div>
        </div>
        <div className="ui-result-verdict">
          <Meter
            value={scoreNum}
            display={`KKM ${passingScoreNum}%`}
            tone={isPassed ? "success" : "error"}
          />
          <p className="ui-result-note">
            {isPassed
              ? "Kamu memenuhi kriteria kelulusan — bukti tersimpan untuk mastery."
              : "Belum memenuhi KKM. Cek rekomendasi latihan untuk menutup gap yang terdeteksi."}
          </p>
        </div>
      </Card>

      <div className="ui-stat-grid">
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum">{result.total_questions}</span>
          <span className="ui-eyebrow">Total soal</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum ok">{result.correct_count}</span>
          <span className="ui-eyebrow">Benar</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-num ui-tnum warn">{result.incorrect_count}</span>
          <span className="ui-eyebrow">Salah</span>
        </Card>
        <Card className="ui-stat">
          <span className="ui-stat-num ui-mono ui-tnum" style={{ fontSize: 18, paddingTop: 8 }}>
            {result.score_adjustment ? "RAPOR" : "SELESAI"}
          </span>
          <span className="ui-eyebrow">Status sesi</span>
        </Card>
      </div>

      <div className="ui-pair">
        <Button to="/assessments" variant="ghost">
          ← Daftar Asesmen
        </Button>
        {result.assessment_type === "PRACTICE" && (
          <Button to={`/practices/attempts/${result.id}/result`} variant="subtle">
            Detail Latihan
          </Button>
        )}
        {!isPassed && result.assessment_id && (
          <Button to={`/reassess/${result.assessment_id}`}>Uji Ulang</Button>
        )}
        <Button to="/learning-path">Buka Learning Path →</Button>
      </div>
    </div>
  );
}