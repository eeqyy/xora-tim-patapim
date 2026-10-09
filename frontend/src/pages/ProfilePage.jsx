// ============================================================
// XORA — Learner Profile Page
// frontend/src/pages/ProfilePage.jsx
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "../context/RouterContext";
import { profileApi, subjectsApi } from "../services/api";

const EXPERIENCE_OPTIONS = [
  { value: "BEGINNER", label: "Beginner / Pemula" },
  { value: "INTERMEDIATE", label: "Intermediate / Menengah" },
  { value: "ADVANCED", label: "Advanced / Lanjutan" },
];

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  // 404 dari GET /api/profile = user memang belum punya learner_profiles
  // (mis. akun admin). Tampilkan empty-state, bukan pesan error mentah.
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
      setEditError("Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: editForm.name.trim(),
        learning_goal: editForm.learning_goal.trim() ? editForm.learning_goal.trim() : null,
        experience_level: editForm.experience_level.trim() ? editForm.experience_level.trim() : null,
        preferred_subject_id: editForm.preferred_subject_id ? editForm.preferred_subject_id : null,
      };

      const res = await profileApi.updateProfile(payload);
      if (res?.data) {
        setProfileData(res.data);
      }
      await refreshUser();
      setIsEditing(false);
      setSuccessMessage("Profil berhasil diperbarui!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setEditError(err.message || "Gagal memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsOnboardingUpdating(true);
    setSuccessMessage(null);
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
      setSuccessMessage("Selamat! Tahap onboarding telah berhasil diselesaikan.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFetchError(err.message || "Gagal menyelesaikan tahap onboarding.");
    } finally {
      setIsOnboardingUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="card loading-card">
          <p>Memuat profil pembelajar...</p>
        </div>
      </div>
    );
  }

  if (profileMissing) {
    const isAdmin =
      Array.isArray(authUser?.roles) && authUser.roles.includes("ADMIN");

    return (
      <div className="profile-container">
        <div className="card empty-card">
          <p>Profil pembelajar belum tersedia untuk akun ini.</p>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            {isAdmin
              ? "Akun admin tidak memiliki data profil pembelajar."
              : "Lengkapi data pembelajaran Anda terlebih dahulu."}
          </p>
          <div className="admin-form-actions" style={{ justifyContent: "center" }}>
            {isAdmin && (
              <Link to="/admin/assessments" className="btn btn-primary">
                Buka Halaman Kelola
              </Link>
            )}
            <button onClick={loadProfile} className="btn btn-outline">
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="profile-container">
        <div className="card">
          <div className="alert alert-error">{fetchError}</div>
          <button onClick={loadProfile} className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const user = profileData?.user || authUser;
  const profile = profileData?.profile || {};

  return (
    <div className="profile-container">
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Main Profile Header Card */}
      <div className="card profile-header-card">
        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-title-block">
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email">{user?.email}</p>
            <div className="badge-row">
              <span className={`badge badge-status ${user?.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}>
                {user?.status}
              </span>
              {Array.isArray(user?.roles) &&
                user.roles.map((r) => (
                  <span key={r} className="badge badge-role">
                    {r}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {!isEditing && (
          <button onClick={handleStartEdit} className="btn btn-outline" style={{ marginTop: "1rem" }}>
            Edit Profil
          </button>
        )}
      </div>

      {/* Edit Form Card */}
      {isEditing && (
        <div className="card edit-card">
          <h3 className="section-title">Edit Profil Pembelajar</h3>

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
              <label htmlFor="edit-learning-goal">Tujuan Belajar (Learning Goal)</label>
              <textarea
                id="edit-learning-goal"
                name="learning_goal"
                rows="3"
                placeholder="Contoh: Menguasai arsitektur backend & database PostgreSQL"
                value={editForm.learning_goal}
                onChange={handleEditChange}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-experience-level">Tingkat Pengalaman</label>
              <select
                id="edit-experience-level"
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
              <label htmlFor="edit-preferred-subject">Mata Pelajaran / Subject Pilihan</label>
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
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? "Menyimpan Perubahan..." : "Simpan Profil"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                disabled={isSaving}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Learner Profile Details */}
      <div className="card profile-details-card">
        <h3 className="section-title">Detail Pembelajar</h3>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Tujuan Belajar</span>
            <span className="detail-value">
              {profile.learning_goal || <em className="text-muted">Belum ditentukan</em>}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Tingkat Pengalaman</span>
            <span className="detail-value">
              {profile.experience_level || <em className="text-muted">Belum ditentukan</em>}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Subject Pilihan</span>
            <span className="detail-value">
              {profile.preferred_subject ? (
                <span>
                  <strong>{profile.preferred_subject.name}</strong>
                  {profile.preferred_subject.description && (
                    <span className="subject-desc"> ({profile.preferred_subject.description})</span>
                  )}
                </span>
              ) : (
                <em className="text-muted">Belum memilih subject</em>
              )}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Status Onboarding</span>
            <span className="detail-value">
              {profile.onboarding_completed ? (
                <span className="badge badge-success">Selesai (Completed)</span>
              ) : (
                <span className="badge badge-warning">Belum Selesai</span>
              )}
            </span>
          </div>
        </div>

        {/* Onboarding Completion Action */}
        {!profile.onboarding_completed && (
          <div className="onboarding-action-box">
            <div>
              <h4 style={{ margin: "0 0 0.25rem 0" }}>Selesaikan Onboarding</h4>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#6b7280" }}>
                Tandai bahwa Anda telah menyelesaikan orientasi profil belajar Xora.
              </p>
            </div>
            <button
              onClick={handleCompleteOnboarding}
              className="btn btn-success"
              disabled={isOnboardingUpdating}
            >
              {isOnboardingUpdating ? "Menyelesaikan..." : "Selesaikan Onboarding"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
