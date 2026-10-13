// ============================================================
// XOLEARN — Admin: Kelola Asesmen (list + hapus) — Editorial Grid System
// frontend/src/pages/AdminAssessmentsPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Form pembuatan & pengubahan ada di AdminAssessmentEditorPage
// (/admin/assessments/new dan /admin/assessments/:id) supaya satu sumber
// form yang sama untuk create & edit.
// ============================================================

import React, { useEffect, useState } from "react";
import { assessmentsApi, adminAssessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Button,
  StatusBadge,
  LoadingState,
  EmptyState,
  Alert,
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

const CAPTION_CLASS = cx(
  "border-b px-3 py-3 text-left tabular-nums text-[10px] font-bold uppercase tracking-widest",
  "border-hairline text-muted dark:border-hairline-dark dark:text-muted-dark md:text-[11px]"
);

export default function AdminAssessmentsPage() {
  const { navigate } = useRouter();

  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Hapus asesmen "${item.title}" beserta seluruh soalnya?\n\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await adminAssessmentsApi.remove(item.id);
      setAssessments((prev) => prev.filter((a) => a.id !== item.id));
    } catch (err) {
      setError(err.message || "Gagal menghapus asesmen.");
    }
  };

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

      {isLoading && <LoadingState message="Memuat daftar asesmen..." />}

      {error && !isLoading && <Alert tone="error">{error}</Alert>}

      {!isLoading && !error && assessments.length === 0 && (
        <EmptyState
          title="Belum Ada Asesmen"
          description="Belum ada asesmen. Gunakan tombol “+ Buat Asesmen” untuk memulai."
        />
      )}

      {!isLoading && assessments.length > 0 && (
        <div className={cx("mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
          <table className={TABLE_CLASS}>
            <caption className={CAPTION_CLASS}>
              {assessments.length} asesmen terdaftar. Kolom “Aksi” berisi tombol ubah dan hapus.
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
              {assessments.map((item) => (
                <tr key={item.id}>
                  <th scope="row" className={cx(TD_CLASS, "font-bold")}>
                    {item.title}
                  </th>
                  <td className={TD_CLASS}>
                    <StatusBadge
                      status={item.type}
                      label={TYPE_LABELS[item.type] || item.type}
                      variant={typeVariant(item.type)}
                    />
                  </td>
                  <td className={TD_CLASS}>{item.subject_name}</td>
                  <td className={cx(TD_CLASS, MUTED)}>
                    {[item.level_name, item.topic_name].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className={cx(TD_CLASS, "tabular-nums")}>{item.question_count}</td>
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
                        onClick={() => handleDelete(item)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
