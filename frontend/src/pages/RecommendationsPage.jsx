// ============================================================
// XORA — Rekomendasi (daftar learning action)
// frontend/src/pages/RecommendationsPage.jsx
// ============================================================

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { recommendationsApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { actionTypeMeta, actionStatusMeta } from "../lib/statusMaps";

export default function RecommendationsPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const actions = useAsync(() => recommendationsApi.list(token), [token]);
  const [busy, setBusy] = useState(null);

  const items = Array.isArray(actions.data) ? actions.data : [];

  const runAction = async (action, kind) => {
    setBusy(`${action.id}:${kind}`);
    try {
      if (kind === "start") {
        const res = await recommendationsApi.start(action.id, token);
        const attemptId = res?.data?.attempt?.id;
        const assessmentId =
          res?.data?.attempt?.assessment_id || res?.data?.assessment?.id;
        if (attemptId && assessmentId) navigate(`/assessments/${assessmentId}`);
        else if (attemptId) navigate(`/attempts/${attemptId}`);
        else navigate("/recommendations");
      } else if (kind === "complete") {
        await recommendationsApi.complete(action.id, token);
        toast({ title: "Aksi selesai", message: "Rekomendasi ditandai selesai.", tone: "success" });
        actions.run();
        setBusy(null);
      } else if (kind === "skip") {
        await recommendationsApi.skip(action.id, token);
        toast({ title: "Aksi dilewati", message: "Rekomendasi dilewati.", tone: "info" });
        actions.run();
        setBusy(null);
      }
    } catch (err) {
      toast({ title: "Gagal", message: err.message || "Terjadi kesalahan.", tone: "error" });
      setBusy(null);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Rekomendasi"
        title="Langkah belajar berikutnya"
        desc="Action yang disusun dari hasil diagnostik, diurutkan berdasarkan prioritas dampak."
      />

      {actions.error ? (
        <ErrorState message="Gagal memuat rekomendasi." detail={actions.error.message} onRetry={actions.run} />
      ) : actions.loading ? (
        <SkeletonList count={4} variant="card" />
      ) : items.length === 0 ? (
        <Card>
          <div className="ui-empty">
            <div className="ui-empty-title">Belum ada rekomendasi aktif</div>
            <div className="ui-empty-desc">
              Selesaikan asesmen dan latihan supaya mesin bisa menyusun langkah berikutnya.
            </div>
            <div className="ui-empty-action">
              <Button to="/assessments">Cari Asesmen</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="ui-action-list">
          {items.map((action) => {
            const meta = actionTypeMeta(action.action_type);
            const status = actionStatusMeta(action.status);
            const canStart = ["RECOMMENDED", "IN_PROGRESS"].includes(action.status);
            return (
              <Card key={action.id} className="ui-action" elevated={action.priority === 1}>
                <div className="ui-action-head">
                  <Badge variant={meta.tone} dot>
                    {meta.label}
                  </Badge>
                  {action.priority <= 2 && <Badge variant="outline">prioritas {action.priority}</Badge>}
                  <span className="ui-mono ui-dim">{status.label}</span>
                  {action.gap_concept_name && (
                    <span className="ui-mono ui-dim">gap: {action.gap_concept_name}</span>
                  )}
                </div>
                <div className="ui-action-concept">{action.concept_name}</div>
                <p className="ui-action-reason">{action.reason}</p>
                {Array.isArray(action.materials) && action.materials.length > 0 && (
                  <div className="ui-mono ui-dim">{action.materials.length} materi terkait</div>
                )}
                <div className="ui-action-btns">
                  <Button to={`/materials/${action.id}`} size="sm" variant="subtle">
                    Materi
                  </Button>
                  {canStart && (
                    <Button size="sm" onClick={() => runAction(action, "start")} loading={busy === `${action.id}:start`}>
                      Mulai
                    </Button>
                  )}
                  {action.action_type !== "RUN_DIAGNOSTIC" && action.status === "RECOMMENDED" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => runAction(action, "complete")} loading={busy === `${action.id}:complete`}>
                        Selesaikan
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => runAction(action, "skip")} loading={busy === `${action.id}:skip`}>
                        Lewati
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}