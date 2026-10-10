// ============================================================
// XORA — Konfirmasi Learning Path (sebelum onboarding selesai)
// Tampilkan pratinjau jalur belajar dari subject pilihan, lalu
// tutup onboarding dengan PATCH /api/profile/onboarding.
// frontend/src/pages/LearningPathConfirmPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { profileApi, learningPathApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";

function countNodes(levels) {
  let topics = 0;
  let concepts = 0;
  for (const lvl of levels || []) {
    topics += lvl.topics?.length || 0;
    for (const t of lvl.topics || []) concepts += t.concepts?.length || 0;
  }
  return { levels: levels?.length || 0, topics, concepts };
}

export default function LearningPathConfirmPage() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();

  const [path, setPath] = useState(null);
  const [pathError, setPathError] = useState(null);
  const [pathLoading, setPathLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  useEffect(() => {
    let active = true;
    learningPathApi
      .getPath(null, token)
      .then((json) => {
        if (active) setPath(json?.data || null);
      })
      .catch((err) => {
        if (active) setPathError(err.message || "Gagal memuat pratinjau learning path.");
      })
      .finally(() => {
        if (active) setPathLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      await profileApi.completeOnboarding(token);
      toast({ title: "Onboarding selesai", message: "Learning map kamu siap dijelajahi.", tone: "success" });
      navigate("/profile");
    } catch (err) {
      setConfirmError(err.message || "Gagal menyelesaikan onboarding.");
    } finally {
      setConfirming(false);
    }
  };

  const stats = path ? countNodes(path.levels) : null;

  return (
    <div className="auth-container ui-confirm-wrap">
      <Card surface className="ui-confirm-card">
        <div className="ui-eyebrow">Learning path kamu</div>
        <h2 className="auth-title">Siap, ini jalur belajarmu</h2>

        {pathLoading ? (
          <SkeletonList count={3} variant="card" />
        ) : pathError ? (
          <div className="ui-form-error" role="alert">
            {pathError}
          </div>
        ) : path ? (
          <>
            <div className="ui-confirm-subject">
              <div className="ui-confirm-subject-name">{path.subject?.name}</div>
              {path.subject?.description && (
                <div className="ui-confirm-subject-desc">{path.subject.description}</div>
              )}
            </div>

            <div className="ui-confirm-stats">
              <div className="ui-confirm-stat">
                <span className="ui-confirm-stat-num ui-num">{stats.levels}</span>
                <span className="ui-eyebrow">Level</span>
              </div>
              <div className="ui-confirm-stat">
                <span className="ui-confirm-stat-num ui-num">{stats.topics}</span>
                <span className="ui-eyebrow">Topik</span>
              </div>
              <div className="ui-confirm-stat">
                <span className="ui-confirm-stat-num ui-num">{stats.concepts}</span>
                <span className="ui-eyebrow">Konsep</span>
              </div>
            </div>

            <div className="ui-confirm-preview">
              {(path.levels || []).slice(0, 3).map((lvl) => (
                <div key={lvl.id} className="ui-confirm-level">
                  <div className="ui-confirm-level-top">
                    <span className="ui-confirm-level-name">{lvl.name}</span>
                    <Badge variant="outline">{lvl.difficulty || "default"}</Badge>
                  </div>
                  {lvl.topics?.length > 0 && (
                    <div className="ui-confirm-topics">
                      {lvl.topics.slice(0, 4).map((t) => (
                        <span key={t.id} className="ui-chip">
                          {t.name}
                        </span>
                      ))}
                      {lvl.topics.length > 4 && (
                        <span className="ui-mono ui-dim">+{lvl.topics.length - 4} topik</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {path.levels?.length === 0 && (
              <div className="ui-empty">
                <div className="ui-empty-title">Belum ada level untuk subject ini</div>
                <div className="ui-empty-desc">
                  Kamu tetap bisa lanjut — asesmen awal akan memetakan kesiapanmu.
                </div>
              </div>
            )}
          </>
        ) : null}

        {confirmError && (
          <div className="ui-form-error" role="alert">
            {confirmError}
          </div>
        )}

        <div className="ui-onboard-actions">
          <Button variant="ghost" onClick={() => navigate("/onboarding")} disabled={confirming}>
            Ubah Pilihan
          </Button>
          <Button onClick={handleConfirm} loading={confirming}>
            Konfirmasi & Mulai
          </Button>
        </div>
      </Card>
    </div>
  );
}