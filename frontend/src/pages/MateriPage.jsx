// ============================================================
// XORA — Materi (read-list per action)
// frontend/src/pages/MateriPage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { recommendationsApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { materialTypeMeta } from "../lib/statusMaps";

export default function MateriPage({ params }) {
  const actionId = params?.actionId;
  const { token } = useAuth();
  const { navigate } = useRouter();
  const materials = useAsync(() => recommendationsApi.getMaterials(actionId, token), [actionId, token]);

  const data = materials.data;
  const list = Array.isArray(data?.materials) ? data.materials : [];

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Materi"
        title="Bahan belajar konsep gap"
        desc="Bacaan dan contoh yang relevan untuk menutup gap sebelum/ketika berlatih."
        backLabel="Kembali"
        onBack={() => navigate(-1)}
      />

      {materials.error ? (
        <ErrorState message="Gagal memuat materi." detail={materials.error.message} onRetry={materials.run} />
      ) : materials.loading ? (
        <SkeletonList count={4} variant="card" />
      ) : list.length === 0 ? (
        <Card>
          <div className="ui-empty">
            <div className="ui-empty-title">Belum ada materi untuk konsep ini</div>
            <div className="ui-empty-desc">Admin bisa menambahkan materi (artikel, video, contoh kode) ke topik terkait.</div>
            <div className="ui-empty-action">
              <Button to="/assessments">Langsung latihan →</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="ui-material-list">
          {list.map((m) => {
            const meta = materialTypeMeta(m.type);
            return (
              <Card key={m.id} className="ui-material">
                <div className="ui-material-meta">
                  <Badge variant={meta.tone}>{meta.label}</Badge>
                  {m.topic_name && <span className="ui-dim">{m.topic_name}</span>}
                  <span className="ui-mono ui-dim">#{m.order_index}</span>
                </div>
                <div className="ui-material-title">{m.title}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}