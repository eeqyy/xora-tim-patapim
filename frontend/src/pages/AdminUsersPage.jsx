// ============================================================
// XOLEARN — Admin: Kelola Pengguna — Editorial Grid System
// frontend/src/pages/AdminUsersPage.jsx
// ============================================================
// Melihat daftar akun, mengubah status (aktif/nonaktif/suspend),
// mengatur role, dan reset password. Hanya bisa dibuka lewat
// AdminRoute (role ADMIN).
//
// Pencarian/filter pil langsung diterapkan (tanpa tombol Terapkan);
// di layar sempit tabel berubah jadi daftar kartu (`table-cards`,
// lihat index.css) supaya tidak perlu digeser ke samping.
//
// Admin tidak bisa mengubah status/role akunnya sendiri — tombolnya
// dinonaktifkan di UI dan tetap ditolak backend (403).
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { adminUsersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import { useToast } from "../context/ToastContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  StatusBadge,
  SecondaryButton,
  OutlineButton,
  SkeletonTable,
  EmptyState,
  Alert,
  Field,
  Input,
  Select,
  FilterChips,
  AnimatedContent,
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

const ROLE_FILTERS = [
  { value: "ALL", label: "Semua" },
  { value: "LEARNER", label: "Learner" },
  { value: "ADMIN", label: "Admin" },
];

const STATUS_FILTERS = [
  { value: "ALL", label: "Semua" },
  ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

const SORT_OPTIONS = [
  { value: "NAME", label: "Nama (A–Z)" },
  { value: "NEWEST", label: "Terbaru" },
  { value: "OLDEST", label: "Terlama" },
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
  const { confirm, prompt } = useDialog();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Dipakai untuk memaksa render ulang saat pengguna membatalkan konfirmasi,
  // supaya <select> kembali menampilkan nilai yang sebenarnya.
  const [, forceUpdate] = useState(0);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState("NAME");

  const mountedRef = useRef(false);

  const loadUsers = async (filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminUsersApi.list({
        search: filters.search || "",
        role: filters.role || "",
        status: filters.status || "",
      });
      setUsers(Array.isArray(res?.data?.items) ? res.data.items : []);
      setTotal(res?.data?.total || 0);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  // Pencarian/filter diterapkan otomatis (ketikan ditahan sesaat).
  useEffect(() => {
    const delay = search.trim() ? 320 : 0;
    const timer = setTimeout(() => {
      mountedRef.current = true;
      loadUsers({
        search,
        role: roleFilter === "ALL" ? "" : roleFilter,
        status: statusFilter === "ALL" ? "" : statusFilter,
      });
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  const filtersActive = search.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  const visible = useMemo(() => {
    const rows = users.slice();
    if (sort === "NEWEST") {
      rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sort === "OLDEST") {
      rows.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else {
      rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "id"));
    }
    return rows;
  }, [users, sort]);

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
    try {
      const res = await adminUsersApi.updateStatus(target.id, newStatus);
      const updated = res?.data?.user;
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, status: updated?.status || newStatus } : u))
      );
      toast.success(`Status “${target.name}” diubah menjadi ${label}.`);
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
    try {
      const res = await adminUsersApi.updateRoles(target.id, option.roles);
      const roles = res?.data?.roles || option.roles;
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, roles } : u)));
      toast.success(`Role “${target.name}” diubah menjadi ${option.label}.`);
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
    try {
      const res = await adminUsersApi.resetPassword(target.id, newPassword);
      const revoked = res?.data?.revoked_sessions ?? 0;
      toast.success(
        `Password “${target.name}” diubah. ${revoked} sesi aktif dicabut — ia harus login ulang.`
      );
    } catch (err) {
      setError(err.message || "Gagal reset password.");
    } finally {
      setBusyId(null);
    }
  };

  const isSelf = (item) => currentUser && item.id === currentUser.id;

  const initialLoading = isLoading && users.length === 0 && !mountedRef.current;

  return (
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="Kelola Pengguna"
        description={`${total} akun terdaftar. Ubah status, atur role, atau reset password bila diperlukan. Tindakan perubahan tercatat di audit log.`}
      />

      {/* Filter */}
      <AnimatedContent>
        <GlassPanel variant="subtle" className="mt-8 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Cari nama / email" htmlFor="user-search">
              <Input
                id="user-search"
                type="search"
                value={search}
                placeholder="mis. budi atau budi@mail.com"
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
            <Field label="Role">
              <FilterChips
                ariaLabel="Filter role pengguna"
                options={ROLE_FILTERS}
                value={roleFilter}
                onChange={setRoleFilter}
              />
            </Field>
            <Field label="Status">
              <FilterChips
                ariaLabel="Filter status pengguna"
                options={STATUS_FILTERS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <Field label="Urutkan tampilan" htmlFor="user-sort" className="min-w-[200px]">
              <Select id="user-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            {filtersActive && (
              <OutlineButton size="sm" type="button" onClick={resetFilters}>
                Reset pencarian & filter
              </OutlineButton>
            )}
          </div>
        </GlassPanel>
      </AnimatedContent>

      {error && (
        <Alert tone="error" className="mt-8">
          {error}
        </Alert>
      )}

      {initialLoading && <SkeletonTable rows={5} columns={4} className="mt-8" />}

      {!initialLoading && !error && users.length === 0 && (
        <EmptyState
          title={filtersActive ? "Tidak Ada Hasil" : "Belum Ada Pengguna"}
          description={
            filtersActive
              ? "Tidak ada pengguna yang cocok dengan pencarian/filter saat ini."
              : "Belum ada akun pengguna yang terdaftar."
          }
          action={
            filtersActive ? (
              <OutlineButton size="sm" type="button" onClick={resetFilters}>
                Reset pencarian & filter
              </OutlineButton>
            ) : null
          }
        />
      )}

      {!initialLoading && visible.length > 0 && (
        <AnimatedContent>
          <div className={cx("table-cards mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
            <table className={TABLE_CLASS}>
              <caption className={CAPTION_CLASS}>
                Menampilkan {visible.length} dari {total} akun{isLoading ? " · memuat…" : ""}. Akun
                Anda sendiri tidak dapat diubah status/role-nya di sini.
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
                {visible.map((item) => {
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
                      <td className={cx(TD_CLASS, MUTED)} data-label="Email">
                        {item.email}
                      </td>
                      <td className={TD_CLASS} data-label="Role">
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
                      <td className={TD_CLASS} data-label="Status">
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
                      <td className={cx(TD_CLASS, MUTED)} data-label="Dibuat">
                        {formatDate(item.created_at)}
                      </td>
                      <td className={TD_CLASS}>
                        <div className="flex flex-wrap gap-2">
                          <SecondaryButton
                            size="sm"
                            disabled={busy}
                            onClick={() => handleResetPassword(item)}
                          >
                            {busy ? "Memproses…" : "Reset Password"}
                          </SecondaryButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AnimatedContent>
      )}
    </PageContainer>
  );
}
