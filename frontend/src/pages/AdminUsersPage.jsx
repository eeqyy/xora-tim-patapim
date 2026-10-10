// ============================================================
// XORA — Admin: Pengguna (list + role + status)
// frontend/src/pages/AdminUsersPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Oversight akun: lihat semua user (dengan role & profil), atur role
// (LEARNER/ADMIN) dan status (ACTIVE/INACTIVE/SUSPENDED). Tidak ada
// buat/hapus — registrasi via auth, hapus dicegah FK RESTRICT.
// Pengaman di backend: admin tidak bisa mencabut role ADMIN dari diri
// sendiri, dan ADMIN aktif terakhir tidak bisa dicabut/dinonaktifkan.
// Respons adminUserApi sudah dinormalisasi ke camelCase.
// ============================================================

import React, { useEffect, useState } from "react";
import { adminUserApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminNav from "../components/ui/AdminNav";

const ROLE_OPTIONS = ["LEARNER", "ADMIN"];
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Nonaktif" },
  { value: "SUSPENDED", label: "Ditangguhkan" },
];

const ROLE_LABELS = { LEARNER: "Pelajar", ADMIN: "Admin" };
const STATUS_LABELS = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  SUSPENDED: "Ditangguhkan",
};

const roleBadgeClass = (role) =>
  role === "ADMIN" ? "badge badge-topic" : "badge badge-role";

const statusBadgeClass = (status) => {
  switch (status) {
    case "ACTIVE":
      return "badge badge-success";
    case "INACTIVE":
      return "badge badge-difficulty badge-hard";
    case "SUSPENDED":
      return "badge badge-warning";
    default:
      return "badge badge-role";
  }
};

const profileLabel = (user) => {
  const parts = [];
  if (user.employeeCode) parts.push(`Kode pegawai: ${user.employeeCode}`);
  if (user.learningGoal) parts.push(user.learningGoal);
  if (user.experienceLevel) parts.push(`Level: ${user.experienceLevel}`);
  if (user.onboardingCompleted) parts.push("Onboarding selesai");
  return parts.join(" · ") || "—";
};

export default function AdminUsersPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState(null); // user object
  const [formRoles, setFormRoles] = useState([]);
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = async (keyword = search) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminUserApi.list(token, { search: keyword });
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    loadData(search);
  };

  const handleEdit = (user) => {
    setEditing(user);
    setFormRoles(Array.isArray(user.roles) ? [...user.roles] : []);
    setFormStatus(user.status || "ACTIVE");
    setFormError(null);
  };

  const toggleRole = (role) => {
    setFormRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formRoles.length === 0) {
      setFormError("Pilih minimal satu role (LEARNER atau ADMIN).");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await adminUserApi.setRoles(editing.id, formRoles, token);
      const updated = await adminUserApi.setStatus(editing.id, formStatus, token);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editing.id ? { ...u, ...(updated?.data || {}) } : u
        )
      );
      setEditing(null);
      setFormRoles([]);
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan perubahan pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormRoles([]);
    setFormError(null);
  };

  return (
    <div className="assessment-container">
      <AdminNav />

      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Pengguna</h1>
            <p className="assessment-subtitle">
              Lihat seluruh akun, atur role (pelajar/admin) dan status.
              Admin aktif terakhir tidak bisa dicabut atau dinonaktifkan.
            </p>
          </div>
        </div>
      </div>

      {/* Pencarian */}
      <section className="card" aria-labelledby="user-search-heading">
        <h2 id="user-search-heading" className="admin-section-title">
          Cari Pengguna
        </h2>
        <form className="admin-form admin-form-grid" onSubmit={handleSearch} noValidate>
          <div className="form-group">
            <label htmlFor="user-search">Nama atau email</label>
            <input
              id="user-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik untuk mencari..."
            />
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary">
              Cari
            </button>
          </div>
        </form>
      </section>

      {/* Formulir ubah role & status */}
      {editing && (
        <section className="card" aria-labelledby="user-edit-heading">
          <h2 id="user-edit-heading" className="admin-section-title">
            Ubah Role & Status — {editing.name}{" "}
            <span className="admin-cell-muted">({editing.email})</span>
          </h2>

          {formError && (
            <div className="alert alert-error" role="alert">
              <p>{formError}</p>
            </div>
          )}

          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-form-grid">
              <fieldset className="admin-fieldset">
                <legend>Role</legend>
                {ROLE_OPTIONS.map((role) => (
                  <label key={role} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={formRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    <span className={roleBadgeClass(role)}>
                      {ROLE_LABELS[role] || role}
                    </span>
                  </label>
                ))}
              </fieldset>

              <div className="form-group">
                <label htmlFor="user-status">Status</label>
                <select
                  id="user-status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Loading / error / kosong / tabel */}
      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar pengguna...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="card empty-card">
          <p>Tidak ada pengguna yang cocok.</p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                {users.length} pengguna. Gunakan tombol “Ubah” untuk mengatur
                role dan status.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Profil</th>
                  <th scope="col" className="admin-col-actions">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <th scope="row" className="admin-cell-title">
                      {user.name}
                    </th>
                    <td className="admin-cell-muted">{user.email}</td>
                    <td>
                      <div className="btn-group">
                        {(user.roles || []).map((role) => (
                          <span key={role} className={roleBadgeClass(role)}>
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={statusBadgeClass(user.status)}>
                        {STATUS_LABELS[user.status] || user.status}
                      </span>
                    </td>
                    <td className="admin-cell-muted">{profileLabel(user)}</td>
                    <td className="admin-cell-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(user)}
                        aria-label={`Ubah role dan status ${user.name}`}
                      >
                        Ubah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}