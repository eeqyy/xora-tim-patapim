// ============================================================
// XOLEARN — Admin: Kelola Asesmen (list + hapus) — Editorial Grid System
// frontend/src/pages/AdminAssessmentsPage.jsx
// ============================================================
// Daftar asesmen dengan pencarian, filter tipe, dan pengurutan.
// Di layar sempit tabel berubah jadi daftar kartu (kelas
// `table-cards`, lihat index.css) supaya tidak perlu digeser.
//
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Form pembuatan & pengubahan ada di AdminAssessmentEditorPage
// (/admin/assessments/new dan /admin/assessments/:id) supaya satu sumber
// form yang sama untuk create & edit.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { assessmentsApi, adminAssessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import { useDialog } from "../context/DialogContext";
import { useToast } from "../context/ToastContext";
import {
  PageContainer,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Button,
  StatusBadge,
  SkeletonTable,
  EmptyState,
  Alert,
  GlassPanel,
  FilterChips,
  Field,
  Input,
  Select,
  OutlineButton,
  AnimatedContent,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
  HAIRLINE,
  MUTED,
  cx,
} from "../components";

const TYPE_LABELS = {
  PRACTICE: "Latihan",
  TOPIC: "Topik",
  LEVEL_FINAL: "Ujian Level",
  MIXED: "Campuran",
  REASSESSMENT: "Remedial",
};

const SORT_OPTIONS = [
  { value: "TITLE", label: "Judul (A–Z)" },
  { value: "QUESTIONS_DESC", label: "Soal terbanyak" },
  { value: "QUESTIONS_ASC", label: "Soal tersedikit" },
];

const CAPTION_CLASS = cx(
  "border-b px-3 py-3 text-left tabular-nums text-[10px] font-bold uppercase tracking-widest",
  "border-hairline text-muted dark:border-hairline-dark dark:text-muted-dark md:text-[11px]"
);

const typeVariant = (type) => {
  switch (type) {
    case "LEVEL_FINAL":
      return "error";
    case "TOPIC":
      return "primary";
    case "PRACTICE":
      return "warning";
    default:
      return "neutral";
  }
};

export default function AdminAssessmentsPage() {
  const { navigate } = useRouter();
  const { confirm } = useDialog();
  const toast = useToast();

  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sort, setSort] = useState("TITLE");

  const loadAssessments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await assessmentsApi.getAll();
      setAssessments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar asesmen.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeOptions = useMemo(() => {
    const found = Array.from(new Set(assessments.map((a) => a.type).filter(Boolean)));
    return [
      { value: "ALL", label: "Semua" },
      ...found.map((t) => ({ value: t, label: TYPE_LABELS[t] || t })),
    ];
  }, [assessments]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = assessments.filter((item) => {
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
      if (!needle) return true;
      return [
        item.title,
        item.subject_name,
        item.level_name,
        item.topic_name,
        TYPE_LABELS[item.type] || item.type,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });

    const sorted = rows.slice();
    if (sort === "QUESTIONS_DESC") {
      sorted.sort((a, b) => (b.question_count || 0) - (a.question_count || 0));
    } else if (sort === "QUESTIONS_ASC") {
      sorted.sort((a, b) => (a.question_count || 0) - (b.question_count || 0));
    } else {
      sorted.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "id"));
    }
    return sorted;
  }, [assessments, search, typeFilter, sort]);

  const filtersActive = search.trim() !== "" || typeFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setSort("TITLE");
  };

  const handleDelete = async (item) => {
    const confirmed = await confirm({
      title: `Hapus asesmen "${item.title}"?`,
      description: "Seluruh soal di dalamnya ikut terhapus. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (!confirmed) return;

    setBusyId(item.id);
    setError(null);
    try {
      await adminAssessmentsApi.remove(item.id);
      setAssessments((prev) => prev.filter((a) => a.id !== item.id));
      toast.success(`Asesmen “${item.title}” dihapus.`);
    } catch (err) {
      setError(err.message || "Gagal menghapus asesmen.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="Kelola Asesmen"
        description="Buat asesmen baru, ubah detailnya, dan atur isinya. Perubahan di sini langsung dipakai saat peserta mengerjakan asesmen."
        actions={
          <PrimaryButton onClick={() => navigate("/admin/assessments/new")}>
            + Buat Asesmen
          </PrimaryButton>
        }
      />

      {error && (
        <Alert tone="error" className="mt-8">
          {error}
        </Alert>
      )}

      {isLoading && <SkeletonTable rows={5} columns={4} className="mt-8" />}

      {!isLoading && assessments.length > 0 && (
        <AnimatedContent>
          <GlassPanel variant="subtle" className="mt-8 p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Cari asesmen" htmlFor="assessment-search">
                <Input
                  id="assessment-search"
                  type="search"
                  value={search}
                  placeholder="mis. Aljabar atau Latihan"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
              <Field label="Tipe">
                <FilterChips
                  ariaLabel="Filter tipe asesmen"
                  options={typeOptions}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
              </Field>
              <Field label="Urutkan" htmlFor="assessment-sort">
                <Select
                  id="assessment-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {filtersActive && (
              <div className="mt-4">
                <OutlineButton size="sm" type="button" onClick={resetFilters}>
                  Reset pencarian & filter
                </OutlineButton>
              </div>
            )}
          </GlassPanel>
        </AnimatedContent>
      )}

      {!isLoading && assessments.length === 0 && !error && (
        <EmptyState
          title="Belum Ada Asesmen"
          description="Belum ada asesmen. Gunakan tombol “+ Buat Asesmen” untuk memulai."
        />
      )}

      {!isLoading && assessments.length > 0 && visible.length === 0 && (
        <EmptyState
          title="Tidak Ada Hasil"
          description="Tidak ada asesmen yang cocok dengan pencarian/filter saat ini."
          action={
            <OutlineButton size="sm" type="button" onClick={resetFilters}>
              Reset pencarian & filter
            </OutlineButton>
          }
        />
      )}

      {!isLoading && visible.length > 0 && (
        <AnimatedContent>
          <div className={cx("table-cards mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
            <table className={TABLE_CLASS}>
              <caption className={CAPTION_CLASS}>
                Menampilkan {visible.length} dari {assessments.length} asesmen. Kolom “Aksi”
                berisi tombol ubah dan hapus.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={TH_CLASS}>
                    Judul
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    Tipe
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    Subjek
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    Level / Topik
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    Soal
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <th scope="row" className={cx(TD_CLASS, "font-bold")}>
                      {item.title}
                    </th>
                    <td className={TD_CLASS} data-label="Tipe">
                      <StatusBadge
                        status={item.type}
                        label={TYPE_LABELS[item.type] || item.type}
                        variant={typeVariant(item.type)}
                      />
                    </td>
                    <td className={TD_CLASS} data-label="Subjek">
                      {item.subject_name}
                    </td>
                    <td className={cx(TD_CLASS, MUTED)} data-label="Level / Topik">
                      {[item.level_name, item.topic_name].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className={cx(TD_CLASS, "tabular-nums")} data-label="Soal">
                      {item.question_count}
                    </td>
                    <td className={TD_CLASS}>
                      <div className="flex flex-wrap gap-2">
                        <SecondaryButton
                          size="sm"
                          onClick={() => navigate(`/admin/assessments/${item.id}`)}
                        >
                          Ubah
                        </SecondaryButton>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={busyId === item.id}
                          onClick={() => handleDelete(item)}
                        >
                          {busyId === item.id ? "Menghapus…" : "Hapus"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedContent>
      )}
    </PageContainer>
  );
}
