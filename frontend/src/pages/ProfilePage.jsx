// ============================================================
// XORA — Learner Profile Page
// Premium Light Glassmorphism · Minimal · Reusable
// frontend/src/pages/ProfilePage.jsx
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { profileApi, subjectsApi } from "../services/api";
import {
  PageContainer,
  GlassPanel,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components";
import { IconCheck, IconRefresh } from "../components/Icons";

const EXPERIENCE_OPTIONS = [
  { value: "BEGINNER", label: "Beginner / Pemula" },
  { value: "INTERMEDIATE", label: "Intermediate / Menengah" },
  { value: "ADVANCED", label: "Advanced / Lanjutan" },
];

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const { navigate } = useRouter();

  const [profileData, setProfileData] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [profileMissing, setProfileMissing] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    learning_goal: "",
    experience_level: "BEGINNER",
    preferred_subject_id: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Onboarding action state
  const [isOnboardingUpdating, setIsOnboardingUpdating] = useState(false);

  // Fetch full profile and subjects
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setProfileMissing(false);
    try {
      const [profileRes, subjectsRes] = await Promise.all([
        profileApi.getProfile(),
        subjectsApi.getAll().catch(() => ({ data: [] })),
      ]);

      if (profileRes?.data) {
        setProfileData(profileRes.data);
      }
      if (Array.isArray(subjectsRes?.data)) {
        setSubjectsList(subjectsRes.data);
      }
    } catch (err) {
      if (err.status === 404) {
        setProfileMissing(true);
      } else {
        setFetchError(err.message || "Gagal memuat profil pembelajar.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleStartEdit = () => {
    if (!profileData) return;
    setEditForm({
      name: profileData.user?.name || "",
      learning_goal: profileData.profile?.learning_goal || "",
      experience_level: profileData.profile?.experience_level || "BEGINNER",
      preferred_subject_id: profileData.profile?.preferred_subject_id || "",
    });
    setEditError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditError(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError(null);
    setSuccessMessage(null);

    if (!editForm.name.trim()) {
      setEditError("Nama pengguna wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await profileApi.updateProfile({
        name: editForm.name.trim(),
        learning_goal: editForm.learning_goal.trim() || null,
        experience_level: editForm.experience_level,
        preferred_subject_id: editForm.preferred_subject_id || null,
      });

      if (res?.data) {
        setProfileData(res.data);
      }
      setIsEditing(false);
      setSuccessMessage("Profil berhasil diperbarui.");
      setTimeout(() => setSuccessMessage(null), 4000);

      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      setEditError(err.message || "Gagal menyimpan perubahan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsOnboardingUpdating(true);
    setFetchError(null);
    try {
      await profileApi.completeOnboarding();
      setProfileData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            onboarding_completed: true,
          },
        };
      });
      setSuccessMessage("Tahap onboarding telah berhasil diselesaikan.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFetchError(err.message || "Gagal menyelesaikan tahap onboarding.");
    } finally {
      setIsOnboardingUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="normal">
        <LoadingState message="Memuat profil pembelajar..." />
      </PageContainer>
    );
  }

  if (profileMissing) {
    const isAdmin = Array.isArray(authUser?.roles) && authUser.roles.includes("ADMIN");

    return (
      <PageContainer maxWidth="normal">
        <EmptyState
          title="Profil Pembelajar Belum Tersedia"
          description={
            isAdmin
              ? "Akun administrator tidak memiliki catatan profil pembelajar individual."
              : "Lengkapi data pembelajaran Anda terlebih dahulu."
          }
          action={
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              {isAdmin && (
                <PrimaryButton onClick={() => navigate("/admin/assessments")}>
                  Buka Halaman Kelola
                </PrimaryButton>
              )}
              <OutlineButton onClick={loadProfile} icon={<IconRefresh size={14} />}>
                Muat Ulang
              </OutlineButton>
            </div>
          }
        />
      </PageContainer>
    );
  }

  if (fetchError) {
    return (
      <PageContainer maxWidth="normal">
        <ErrorState
          title="Gagal Memuat Profil"
          message={fetchError}
          onRetry={loadProfile}
        />
      </PageContainer>
    );
  }

  const user = profileData?.user || authUser;
  const profile = profileData?.profile || {};

  return (
    <PageContainer maxWidth="normal">
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
          <IconCheck size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <GlassPanel variant="elevated" className="profile-header-card" style={{ marginBottom: "1.5rem" }}>
        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="profile-name">{user?.name}</h1>
            <p className="profile-email">{user?.email}</p>
            <div className="badge-row">
              {Array.isArray(user?.roles) &&
                user.roles.map((r) => (
                  <StatusBadge key={r} status={r} />
                ))}
              <StatusBadge
                variant={user?.is_active ? "success" : "error"}
                label={user?.is_active ? "Aktif" : "Nonaktif"}
                dot
              />
            </div>
          </div>
        </div>

        {!isEditing && (
          <OutlineButton onClick={handleStartEdit}>
            Edit Profil
          </OutlineButton>
        )}
      </GlassPanel>

      {/* Profile Edit Form Card */}
      {isEditing && (
        <GlassPanel variant="default" style={{ marginBottom: "1.5rem" }}>
          <h2 className="section-title">Edit Profil Pembelajar</h2>

          {editError && <div className="alert alert-error">{editError}</div>}

          <form onSubmit={handleSaveProfile} className="auth-form">
            <div className="form-group">
              <label htmlFor="edit-name">Nama Lengkap</label>
              <input
                id="edit-name"
                name="name"
                type="text"
                value={editForm.name}
                onChange={handleEditChange}
                disabled={isSaving}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-goal">Tujuan Belajar (Learning Goal)</label>
              <textarea
                id="edit-goal"
                name="learning_goal"
                rows={3}
                placeholder="Misal: Memahami logika pemrograman dasar & struktur data..."
                value={editForm.learning_goal}
                onChange={handleEditChange}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-experience">Tingkat Pengalaman (Experience Level)</label>
              <select
                id="edit-experience"
                name="experience_level"
                value={editForm.experience_level}
                onChange={handleEditChange}
                disabled={isSaving}
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-preferred-subject">Mata Pelajaran Pilihan</label>
              <select
                id="edit-preferred-subject"
                name="preferred_subject_id"
                value={editForm.preferred_subject_id}
                onChange={handleEditChange}
                disabled={isSaving}
              >
                <option value="">-- Belum Memilih Subject --</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.description ? `— ${s.description}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="btn-group">
              <PrimaryButton type="submit" disabled={isSaving} loading={isSaving}>
                Simpan Profil
              </PrimaryButton>
              <OutlineButton type="button" onClick={handleCancelEdit} disabled={isSaving}>
                Batal
              </OutlineButton>
            </div>
          </form>
        </GlassPanel>
      )}

      {/* Learner Profile Details */}
      <GlassPanel variant="default" className="profile-details-card">
        <h2 className="section-title">Detail Pembelajar</h2>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Tujuan Belajar</span>
            <span className="detail-value">
              {profile.learning_goal || <em style={{ color: "var(--color-text-dim)" }}>Belum ditentukan</em>}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Tingkat Pengalaman</span>
            <span className="detail-value">
              {profile.experience_level || <em style={{ color: "var(--color-text-dim)" }}>Belum ditentukan</em>}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Mata Pelajaran Pilihan</span>
            <span className="detail-value">
              {profile.preferred_subject ? (
                <span>
                  <strong>{profile.preferred_subject.name}</strong>
                  {profile.preferred_subject.description && (
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      {" "}
                      ({profile.preferred_subject.description})
                    </span>
                  )}
                </span>
              ) : (
                <em style={{ color: "var(--color-text-dim)" }}>Belum memilih subject</em>
              )}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Status Onboarding</span>
            <span className="detail-value">
              <StatusBadge
                variant={profile.onboarding_completed ? "success" : "warning"}
                label={profile.onboarding_completed ? "Selesai" : "Belum Selesai"}
                dot
              />
            </span>
          </div>
        </div>

        {/* Onboarding Completion Action */}
        {!profile.onboarding_completed && (
          <div className="onboarding-action-box" style={{ marginTop: "1.5rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem", color: "var(--color-text-main)" }}>
                Selesaikan Orientasi (Onboarding)
              </h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Tandai bahwa Anda telah menyelesaikan orientasi profil belajar Xora.
              </p>
            </div>
            <PrimaryButton
              onClick={handleCompleteOnboarding}
              disabled={isOnboardingUpdating}
              loading={isOnboardingUpdating}
            >
              Selesaikan Onboarding
            </PrimaryButton>
          </div>
        )}
      </GlassPanel>
    </PageContainer>
  );
}
