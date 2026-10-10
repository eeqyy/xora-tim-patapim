// Checkpoint re-assessment: mulai attempt baru -> redirect ke runner /assessments/:id
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { assessmentsApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";

export default function CheckpointPage({ params }) {
  const assessmentId = params?.assessmentId;
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [error, setError] = useState(null);
  const startedRef = useRef(false);

  const runAgain = async () => {
    setError(null);
    try {
      const res = await assessmentsApi.reassess(assessmentId, token);
      const aid = res?.data?.attempt?.assessment_id || assessmentId;
      navigate(`/assessments/${aid}`);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    if (startedRef.current || !assessmentId) return;
    startedRef.current = true;
    runAgain();
  }, [assessmentId, token]);

  if (error) {
    return (
      <div className="page-container">
        <Card>
          <ErrorState
            message="Gagal memulai uji ulang."
            detail={error.message}
            onRetry={runAgain}
          />
          <div className="ui-pair">
            <Button to="/assessments" variant="subtle">
              Kembali ke daftar asesmen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card>
        <div className="ui-empty">
          <div className="ui-empty-title">Menyiapkan Uji Ulang…</div>
          <div className="ui-empty-desc">
            Attempt baru dibuat, kamu akan diarahkan ke halaman uji ulang seketika.
          </div>
        </div>
        <SkeletonList count={2} variant="card" />
      </Card>
    </div>
  );
}
