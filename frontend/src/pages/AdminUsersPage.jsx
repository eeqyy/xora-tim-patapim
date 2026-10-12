// ============================================================
// XORA — Admin: Kelola Pengguna
// frontend/src/pages/AdminUsersPage.jsx
// ============================================================
// Melihat daftar akun, mengubah status (aktif/nonaktif/suspend),
// mengatur role, dan reset password. Hanya bisa dibuka lewat
// AdminRoute (role ADMIN).
//
// Admin tidak bisa mengubah status/role akunnya sendiri — tombolnya
// dinonaktifkan di UI dan tetap ditolak backend (403).
// ============================================================

import React, { useEffect, useState } from "react";
import { adminUsersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  SUSPENDED: "Suspend",
};

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const ROLE_OPTIONS = [
  { value: "LEARNER", label: "Learner", roles: ["LEARNER"] },
  { value: "ADMIN", label: "Admin", roles: ["ADMIN"] },
  { value: "BOTH", label: "Learner + Admin", roles: ["LEARNER", "ADMIN"] },
];

function roleValueFromRoles(roles = []) {
  const hasLearner = roles.includes("LEARNER");
  const hasAdmin = roles.includes("ADMIN");
  if (hasLearner && hasAdmin) return "BOTH";
  if (hasAdmin) return "ADMIN";
  return "LEARNER";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("id-ID");
  } catch {
    return String(value);
  }
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Dipakai untuk memaksa render ulang saat pengguna membatalkan konfirmasi,
  // supaya <select> kembali menampilkan nilai yang sebenarnya.
  const [, forceUpdate] = useState(0);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadUsers = async (filters = {}) => {
    const active = {
      search: filters.search || "",
      role: filters.role || "",
      status: filters.status || "",
    };
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminUsersApi.list(active);
      setUsers(Array.isArray(res?.data?.items) ? res.data.items : []);
      setTotal(res?.data?.total || 0);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    loadUsers({ search, role: roleFilter, status: statusFilter });
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    loadUsers({});
  };

  const handleStatusChange = async (target, newStatus) => {
    if (newStatus === target.status) return;
    const label = STATUS_LABELS[newStatus] || newStatus;
    const confirmed = window.confirm(
      `Ubah status "${target.name}" menjadi ${label}?\n\n` +
        (newStatus === "ACTIVE"
          ? "Akun kembali bisa login."
          : "Semua sesi aktif akun ini akan dicabut dan ia tidak bisa login.")
    );
    if (!confirmed) {
      forceUpdate((n) => n + 1);
      return;
    }

    setBusyId(target.id);
    setError(null);
    setNotice(null);
    try {
      const res = await adminUsersApi.updateStatus(target.id, newStatus);
      const updated = res?.data?.user;
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, status: updated?.status || newStatus } : u))
      );
      setNotice(
        `Status "${target.name}" diubah menjadi ${STATUS_LABELS[newStatus] || newStatus}.`
      );
    } catch (err) {
      setError(err.message || "Gagal mengubah status pengguna.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (target, newRoleValue) => {
    const option = ROLE_OPTIONS.find((o) => o.value === newRoleValue);
    if (!option) return;
    if (newRoleValue === roleValueFromRoles(target.roles)) return;

    const confirmed = window.confirm(
      `Ubah role "${target.name}" menjadi ${option.label}?`
    );
    if (!confirmed) {
      forceUpdate((n) => n + 1);
      return;
    }

    setBusyId(target.id);
    setError(null);
    setNotice(null);
    try {
      const res = await adminUsersApi.updateRoles(target.id, option.roles);
      const roles = res?.data?.roles || option.roles;
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, roles } : u)));
      setNotice(`Role "${target.name}" diubah menjadi ${option.label}.`);
    } catch (err) {
      setError(err.message || "Gagal mengubah role pengguna.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (target) => {
    const newPassword = window.prompt(
      `Password baru untuk "${target.name}" (${target.email}).\nMinimal 8 karakter:`
    );
    if (newPassword === null) return;
    if (String(newPassword).length < 8) {
      window.alert("Password minimal 8 karakter.");
      return;
    }

    setBusyId(target.id);
    setError(null);
    setNotice(null);
    try {
      const res = await adminUsersApi.resetPassword(target.id, newPassword);
      const revoked = res?.data?.revoked_sessions ?? 0;
      setNotice(
        `Password "${target.name}" berhasil diubah. ${revoked} sesi aktif dicabut, ` +
          "sehingga ia harus login ulang."
      );
    } catch (err) {
      setError(err.message || "Gagal reset password.");
    } finally {
      setBusyId(null);
    }
  };

  const isSelf = (item) => currentUser && item.id === currentUser.id;

  return (
    <div className="assessment-container">
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Pengguna</h1>
            <p className="assessment-subtitle">
              {total} akun terdaftar. Ubah status, atur role, atau reset password
              bila diperlukan. Tindakan perubahan tercatat di audit log.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card admin-table-card" style={{ marginBottom: "1rem" }}>
        <div className="admin-filter-bar">
          <div className="admin-filter-field">
            <label htmlFor="user-search">Cari nama / email</label>
            <input
              id="user-search"
              type="text"
              value={search}
              placeholder="mis. budi atau budi@mail.com"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>
          <div className="admin-filter-field">
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="LEARNER">Learner</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="admin-filter-field">
            <label htmlFor="user-status">Status</label>
            <select
              id="user-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-filter-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters}>
              Terapkan
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          <p>{notice}</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar pengguna...</p>
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="card empty-card">
          <p>Tidak ada pengguna yang cocok dengan filter.</p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                Menampilkan {users.length} dari {total} akun. Akun Anda sendiri
                tidak dapat diubah status/role-nya di sini.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Dibuat</th>
                  <th scope="col" className="admin-col-actions">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const self = isSelf(item);
                  const busy = busyId === item.id;
                  return (
                    <tr key={item.id}>
                      <th scope="row" className="admin-cell-title">
                        {item.name}
                        {self && <span className="badge badge-subtle" style={{ marginLeft: "0.5rem" }}>Anda</span>}
                      </th>
                      <td className="admin-cell-muted">{item.email}</td>
                      <td>
                        <select
                          className="admin-inline-select"
                          value={roleValueFromRoles(item.roles)}
                          disabled={self || busy}
                          onChange={(e) => handleRoleChange(item, e.target.value)}
                          aria-label={`Role untuk ${item.name}`}
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="admin-inline-select"
                          value={item.status}
                          disabled={self || busy}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          aria-label={`Status untuk ${item.name}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="admin-cell-muted">{formatDate(item.created_at)}</td>
                      <td className="admin-cell-actions">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busy}
                            onClick={() => handleResetPassword(item)}
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
