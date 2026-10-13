// ============================================================
// XOLEARN — 404 Not Found Page (Editorial Grid System)
// frontend/src/pages/NotFoundPage.jsx
// ============================================================

import React from "react";
import { useRouter } from "../context/RouterContext";
import { useAuth } from "../context/AuthContext";
import {
  PageContainer,
  GlassPanel,
  PrimaryButton,
  OutlineButton,
  INK,
  MUTED,
  cx,
} from "../components";
import { IconCompass, IconArrowRight } from "../components/Icons";

export default function NotFoundPage() {
  const { navigate, currentPath } = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <PageContainer maxWidth="narrow" className="flex min-h-[70vh] flex-col justify-center">
      <GlassPanel variant="elevated" className="p-8 text-center md:p-12">
        <div className="flex justify-center">
          <IconCompass size={44} className={INK} />
        </div>

        <p className="mt-4 tabular-nums text-6xl font-semibold leading-none tracking-[-0.03em] text-brand md:text-7xl">
          404
        </p>
        <h1 className={cx("mt-4 text-2xl font-bold tracking-tight md:text-3xl", INK)}>
          Halaman Tidak Ditemukan
        </h1>
        <p className={cx("mx-auto mt-4 max-w-md text-[13px] leading-relaxed", MUTED)}>
          Halaman <code className={cx("font-mono", INK)}>{currentPath}</code> tidak tersedia
          atau sudah dipindahkan.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryButton
            onClick={() => navigate(isAuthenticated ? "/assessments" : "/")}
            iconRight={<IconArrowRight size={16} />}
          >
            {isAuthenticated ? "Ke Daftar Asesmen" : "Ke Beranda"}
          </PrimaryButton>

          {isAuthenticated && (
            <OutlineButton onClick={() => navigate("/")} icon={<IconCompass size={15} />}>
              Beranda
            </OutlineButton>
          )}
        </div>
      </GlassPanel>
    </PageContainer>
  );
}
