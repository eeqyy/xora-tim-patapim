// ============================================================
// XOLEARN — Admin: Kelola Pengguna — Editorial Grid System
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
import { useDialog } from "../context/DialogContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  SecondaryButton,
  SkeletonTable,
  EmptyState,
  Alert,
  Field,
  Input,
  Select,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
  HAIRLINE,
  MUTED,
  cx,
} from "../components";

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

const CAPTION_CLASS = cx(
  "border-b px-3 py-3 text-left tabular-nums text-[10px] font-bold uppercase tracking-widest",
  "border-hairline text-muted dark:border-hairline-dark dark:text-muted-dark md:text-[11px]"
);

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

  const { confirm, prompt } = useDialog();

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
    const confirmed = await confirm({
      title: `Ubah status "${target.name}" menjadi ${label}?`,
      description:
        newStatus === "ACTIVE"
          ? "Akun kembali bisa login."
          : "Semua sesi aktif akun ini akan dicabut dan ia tidak bisa login.",
      confirmLabel: "Ubah Status",
      tone: newStatus === "ACTIVE" ? "primary" : "danger",
    });
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

    const confirmed = await confirm({
      title: `Ubah role "${target.name}" menjadi ${option.label}?`,
      description:
        option.value === "BOTH"
          ? "Akun ini akan bisa masuk sebagai peserta sekaligus admin."
          : option.value === "ADMIN"
          ? "Akun ini akan mendapat akses penuh ke area admin."
          : "Akses admin akun ini akan dicabut.",
      confirmLabel: "Ubah Role",
      tone: option.value === "LEARNER" ? "danger" : "primary",
    });
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
    const newPassword = await prompt({
      title: `Reset password "${target.name}"`,
      description: `${target.email} — semua sesi aktif akan dicabut sehingga ia harus login ulang.`,
      label: "Password baru",
      placeholder: "Minimal 8 karakter",
      minLength: 8,
      confirmLabel: "Reset Password",
      tone: "danger",
    });
    if (newPassword === null) return;

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
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="Kelola Pengguna"
        description={`${total} akun terdaftar. Ubah status, atur role, atau reset password bila diperlukan. Tindakan perubahan tercatat di audit log.`}
      />

      {/* Filter */}
      <GlassPanel variant="subtle" className="mt-8 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Cari nama / email" htmlFor="user-search">
            <Input
              id="user-search"
              type="text"
              value={search}
              placeholder="mis. budi atau budi@mail.com"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </Field>
          <Field label="Role" htmlFor="user-role">
            <Select
              id="user-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="LEARNER">Learner</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="user-status">
            <Select
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
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={applyFilters}>
            Terapkan
          </PrimaryButton>
          <OutlineButton type="button" onClick={resetFilters}>
            Reset
          </OutlineButton>
        </div>
      </GlassPanel>

      {notice && <Alert tone="success">{notice}</Alert>}

      {error && <Alert tone="error">{error}</Alert>}

      {isLoading && <SkeletonTable rows={5} columns={4} className="mt-8" />}

      {!isLoading && !error && users.length === 0 && (
        <EmptyState
          title="Tidak Ada Pengguna"
          description="Tidak ada pengguna yang cocok dengan filter."
        />
      )}

      {!isLoading && users.length > 0 && (
        <div className={cx("mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
          <table className={TABLE_CLASS}>
            <caption className={CAPTION_CLASS}>
              Menampilkan {users.length} dari {total} akun. Akun Anda sendiri
              tidak dapat diubah status/role-nya di sini.
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TH_CLASS}>
                  Nama
                </th>
                <th scope="col" className={TH_CLASS}>
                  Email
                </th>
                <th scope="col" className={TH_CLASS}>
                  Role
                </th>
                <th scope="col" className={TH_CLASS}>
                  Status
                </th>
                <th scope="col" className={TH_CLASS}>
                  Dibuat
                </th>
                <th scope="col" className={TH_CLASS}>
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
                    <th scope="row" className={cx(TD_CLASS, "font-bold")}>
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {item.name}
                        {self && <StatusBadge label="Anda" variant="neutral" />}
                      </span>
                    </th>
                    <td className={cx(TD_CLASS, MUTED)}>{item.email}</td>
                    <td className={TD_CLASS}>
                      <Select
                        className="min-w-[150px]"
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
                      </Select>
                    </td>
                    <td className={TD_CLASS}>
                      <Select
                        className="min-w-[150px]"
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
                      </Select>
                    </td>
                    <td className={cx(TD_CLASS, MUTED)}>{formatDate(item.created_at)}</td>
                    <td className={TD_CLASS}>
                      <div className="flex flex-wrap gap-2">
                        <SecondaryButton
                          size="sm"
                          disabled={busy}
                          onClick={() => handleResetPassword(item)}
                        >
                          Reset Password
                        </SecondaryButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
