// ============================================================
// XOLEARN — Learner Profile Page
// Premium Light Glassmorphism · Minimal · Reusable
// frontend/src/pages/ProfilePage.jsx
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { profileApi, subjectsApi } from "../services/api";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  SectionHeader,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  LoadingState,
  ErrorState,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  Alert,
  Avatar,
  MicroMeta,
  cx,
  INK,
  MUTED,
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
            <div className="flex flex-wrap items-center justify-center gap-3">
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
  const detailIndex = isEditing ? "2" : "1";

  return (
    <PageContainer maxWidth="normal">
      {successMessage && (
        <Alert tone="success">
          <span className="inline-flex items-center gap-2">
            <IconCheck size={16} />
            {successMessage}
          </span>
        </Alert>
      )}

      {/* Header editorial */}
      <PageHeader
        badge="PROFIL PEMBELAJAR"
        title={user?.name}
        description={user?.email}
        actions={
          !isEditing ? (
            <OutlineButton onClick={handleStartEdit}>Edit Profil</OutlineButton>
          ) : null
        }
      />

      {/* Identitas & status akun */}
      <GlassPanel variant="subtle" className="mt-8 flex flex-wrap items-center gap-5 p-5 md:p-6">
        <Avatar name={user?.name} size={56} />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
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
      </GlassPanel>

      {/* Profile Edit Form */}
      {isEditing && (
        <>
          <SectionHeader index="1" title="Edit Profil Pembelajar" />
          {editError && <Alert tone="error">{editError}</Alert>}
          <GlassPanel variant="subtle" className="p-5 md:p-6">
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <Field label="Nama Lengkap" htmlFor="edit-name" required>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange}
                  disabled={isSaving}
                  required
                />
              </Field>

              <Field label="Tujuan Belajar (Learning Goal)" htmlFor="edit-goal">
                <Textarea
                  id="edit-goal"
                  name="learning_goal"
                  rows={3}
                  placeholder="Misal: Memahami logika pemrograman dasar & struktur data..."
                  value={editForm.learning_goal}
                  onChange={handleEditChange}
                  disabled={isSaving}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Tingkat Pengalaman (Experience Level)" htmlFor="edit-experience">
                  <Select
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
                  </Select>
                </Field>

                <Field label="Mata Pelajaran Pilihan" htmlFor="edit-preferred-subject">
                  <Select
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
                  </Select>
                </Field>
              </div>

              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" disabled={isSaving} loading={isSaving}>
                  Simpan Profil
                </PrimaryButton>
                <OutlineButton type="button" onClick={handleCancelEdit} disabled={isSaving}>
                  Batal
                </OutlineButton>
              </div>
            </form>
          </GlassPanel>
        </>
      )}

      {/* Detail Pembelajar */}
      <SectionHeader index={detailIndex} title="Detail Pembelajar" />
      <GlassPanel>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <MicroMeta>Tujuan Belajar</MicroMeta>
            <span className={cx("text-[13px]", INK)}>
              {profile.learning_goal || <em className={MUTED}>Belum ditentukan</em>}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <MicroMeta>Tingkat Pengalaman</MicroMeta>
            <span className={cx("text-[13px]", INK)}>
              {profile.experience_level || <em className={MUTED}>Belum ditentukan</em>}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <MicroMeta>Mata Pelajaran Pilihan</MicroMeta>
            <span className={cx("text-[13px]", INK)}>
              {profile.preferred_subject ? (
                <span>
                  <strong>{profile.preferred_subject.name}</strong>
                  {profile.preferred_subject.description && (
                    <span className={cx("text-[13px]", MUTED)}>
                      {" "}
                      ({profile.preferred_subject.description})
                    </span>
                  )}
                </span>
              ) : (
                <em className={MUTED}>Belum memilih subject</em>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <MicroMeta>Status Onboarding</MicroMeta>
            <span>
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
          <div className="mt-6 flex flex-col gap-4 border-t border-hairline pt-6 dark:border-hairline-dark sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={cx("text-[15px] font-bold", INK)}>
                Selesaikan Orientasi (Onboarding)
              </h3>
              <p className={cx("mt-1 text-[13px] leading-relaxed", MUTED)}>
                Tandai bahwa Anda telah menyelesaikan orientasi profil belajar Xolearn.
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
