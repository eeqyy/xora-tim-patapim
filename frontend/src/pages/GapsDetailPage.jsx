// ============================================================
// XORA — Gap Detail (bukti, root cause, diagnostic, aksi)
// frontend/src/pages/GapsDetailPage.jsx
// ============================================================

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { gapsApi, diagnosticsApi, recommendationsApi } from "../services/api";
import useAsync from "../hooks/useAsync";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import StatusPill from "../components/ui/StatusPill";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { actionTypeMeta, actionStatusMeta, labelOf, DIAGNOSTIC_LABELS } from "../lib/statusMaps";
import { formatDate, formatScore } from "../lib/formatters";

export default function GapsDetailPage({ params }) {
  const conceptId = params?.conceptId;
  const { token } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();

  const detail = useAsync(() => gapsApi.getDetail(conceptId, token), [conceptId, token]);
  const [busy, setBusy] = useState(null);

  const d = detail.data;
  const state = d?.state || null;
  const aggregate = d?.aggregate || null;

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
        setBusy(null);
      } else if (kind === "skip") {
        await recommendationsApi.skip(action.id, token);
        toast({ title: "Aksi dilewati", message: "Rekomendasi dilewati.", tone: "info" });
        setBusy(null);
      }
      detail.run();
    } catch (err) {
      toast({ title: "Gagal", message: err.message || "Terjadi kesalahan.", tone: "error" });
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    const diag = d?.diagnostic;
    if (!diag?.id) return;
    setBusy("verify");
    try {
      const res = await diagnosticsApi.startVerification(diag.id, token);
      const attemptId = res?.data?.attempt?.id;
      const assessmentId = res?.data?.attempt?.assessment_id || res?.data?.assessment?.id;
      if (attemptId && assessmentId) navigate(`/assessments/${assessmentId}`);
      else if (attemptId) navigate(`/attempts/${attemptId}`);
      else navigate("/assessments");
    } catch (err) {
      toast({ title: "Gagal", message: err.message || "Gagal memulai verifikasi.", tone: "error" });
      setBusy(null);
    }
  };

  const handleDiagnose = async () => {
    setBusy("diagnose");
    try {
      await gapsApi.diagnose(conceptId, token);
      toast({ title: "Analisis dijalankan", message: "Deteksi gap di-refresh, cek rekomendasi baru.", tone: "success" });
      setBusy(null);
      detail.run();
    } catch (err) {
      toast({ title: "Gagal", message: err.message || "Gagal menjalankan analisis.", tone: "error" });
      setBusy(null);
    }
  };

  if (detail.error) {
    return (
      <div className="page-container">
        <Card>
          <ErrorState message={detail.error.message} onRetry={detail.run} />
        </Card>
      </div>
    );
  }

  if (detail.loading || !d) {
    return (
      <div className="page-container">
        <SkeletonList count={4} variant="card" />
      </div>
    );
  }

  const diag = d.diagnostic;
  const diagStatus = diag ? labelOf(DIAGNOSTIC_LABELS, diag.diagnostic_status) : null;
  const canVerify = diag && ["PENDING", "HYPOTHESIS"].includes(diag.diagnostic_status);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Gap · Detail Konsep"
        title={d.concept?.name}
        desc={d.concept?.description}
        backLabel="Kembali ke Gap"
        onBack={() => navigate("/gaps")}
        actions={state && <StatusPill kind="gap" status={state.gap_status} />}
      />

      {state ? (
        <Card className="ui-gap-state">
          <div className="ui-gap-state-grid">
            <div className="ui-gap-state-block">
              <div className="ui-eyebrow">Mastery</div>
              <div className="ui-gap-state-big ui-num">{formatScore(state.mastery_score)}</div>
            </div>
            <div className="ui-gap-state-block">
              <div className="ui-eyebrow">Confidence</div>
              <div className="ui-gap-state-big ui-num">{formatScore(state.evidence_confidence)}</div>
            </div>
            <div className="ui-gap-state-block">
              <div className="ui-eyebrow">Bukti</div>
              <div className="ui-gap-state-big ui-num">{state.evidence_count}</div>
            </div>
            <div className="ui-gap-state-block">
              <div className="ui-eyebrow">Terakhir dinilai</div>
              <div className="ui-gap-state-big ui-mono" style={{ fontSize: 14, paddingTop: 4 }}>
                {formatDate(state.last_assessed_at)}
              </div>
            </div>
          </div>
          {state.primary_error_pattern && (
            <div className="ui-gap-pattern">
              Pola error utama: <Badge variant="warning">{state.primary_error_pattern}</Badge>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="ui-empty">
            <div className="ui-empty-title">Belum ada status mastery</div>
            <div className="ui-empty-desc">Kumpulkan bukti dengan asesmen atau latihan terkait konsep ini.</div>
            <div className="ui-empty-action">
              <Button to="/assessments">Cek Asesmen</Button>
            </div>
          </div>
        </Card>
      )}

      {aggregate && (
        <section className="ui-section">
          <div className="ui-section-head">
            <h2 className="ui-section-title">Agregasi Bukti</h2>
            <span className="ui-mono ui-dim">
              {aggregate.evidenceCount} bukti · avg {formatScore(aggregate.averageScore)}% · konsistensi {formatScore(aggregate.consistency)}%
            </span>
          </div>
          <Card>
            {aggregate.errorPatterns && aggregate.errorPatterns.length > 0 ? (
              aggregate.errorPatterns.map((p) => (
                <div key={p.pattern} className="ui-gap-pattern-row">
                  <Badge variant="warning">{p.pattern}</Badge>
                  <span className="ui-mono ui-dim">{p.count}×</span>
                </div>
              ))
            ) : (
              <div className="ui-mono ui-dim">Belum ada pola error terekam.</div>
            )}
          </Card>
        </section>
      )}

      {d.suspectRootCause && (
        <section className="ui-section">
          <div className="ui-section-head">
            <h2 className="ui-section-title">Dugaan Root Cause</h2>
            {d.suspectRootCause.isWeak && <Badge variant="error" dot>belum dikuasai</Badge>}
          </div>
          <Card>
            <div className="ui-gap-rc">
              <div className="ui-gap-rc-name">{d.suspectRootCause.name}</div>
              <MeterScore value={d.suspectRootCause.masteryScore} />
              <span className="ui-mono ui-dim">
                mastery {formatScore(d.suspectRootCause.masteryScore)}% · {d.suspectRootCause.evidenceCount} bukti
              </span>
            </div>
            {d.suspectRootCause.alternatives && d.suspectRootCause.alternatives.length > 0 && (
              <div className="ui-gap-rc-alts">
                <span className="ui-eyebrow">Alternatif</span>
                {d.suspectRootCause.alternatives.map((alt) => (
                  <span key={alt.conceptId} className="ui-mono ui-dim">
                    {alt.name}: {formatScore(alt.masteryScore)}%
                  </span>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {diag && (
        <section className="ui-section">
          <div className="ui-section-head">
            <h2 className="ui-section-title">Diagnostic</h2>
            <Badge variant={diag.diagnostic_status === "VERIFIED" ? "success" : "warning"} dot>
              {diagStatus}
            </Badge>
          </div>
          <Card>
            <div className="ui-kv-row">
              <div className="ui-kv">
                <span className="ui-kv-label">Kandidat root cause</span>
                <span className="ui-kv-value">{d.suspectRootCause?.name || "–"}</span>
              </div>
              <div className="ui-kv">
                <span className="ui-kv-label">Hasil verifikasi</span>
                <span className="ui-kv-value">{diag.verification_result || "–"}</span>
              </div>
              <div className="ui-kv">
                <span className="ui-kv-label">Dibuat</span>
                <span className="ui-kv-value">{formatDate(diag.created_at)}</span>
              </div>
            </div>
            <div className="ui-pair" style={{ marginTop: 14 }}>
              {canVerify && (
                <Button size="sm" onClick={handleVerify} loading={busy === "verify"}>
                  Mulai Verifikasi
                </Button>
              )}
              <Button size="sm" variant="subtle" onClick={handleDiagnose} loading={busy === "diagnose"}>
                Analisa Ulang
              </Button>
            </div>
          </Card>
        </section>
      )}

      {d.actions && d.actions.length > 0 && (
        <section className="ui-section">
          <div className="ui-section-head">
            <h2 className="ui-section-title">Rekomendasi untuk Konsep Ini</h2>
          </div>
          <div className="ui-action-list">
            {d.actions.map((action) => {
              const meta = actionTypeMeta(action.action_type);
              const status = actionStatusMeta(action.status);
              const canStart = ["RECOMMENDED", "IN_PROGRESS"].includes(action.status);
              return (
                <Card key={action.id} className="ui-action">
                  <div className="ui-action-head">
                    <Badge variant={meta.tone} dot>
                      {meta.label}
                    </Badge>
                    <span className="ui-mono ui-dim">prio {action.priority}</span>
                    <span className="ui-mono ui-dim">{status.label}</span>
                  </div>
                  <p className="ui-action-reason">{action.reason}</p>
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
        </section>
      )}
    </div>
  );
}

function MeterScore({ value }) {
  return (
    <div className="ui-meter ui-meter-inline" role="progressbar" aria-valuenow={Math.round(Number(value) || 0)}>
      <div className="ui-meter-track">
        <div
          className={`ui-meter-fill ${(Number(value) || 0) >= 80 ? "ui-meter-fill-success" : (Number(value) || 0) >= 50 ? "ui-meter-fill-warning" : "ui-meter-fill-error"}`}
          style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }}
        />
      </div>
    </div>
  );
}