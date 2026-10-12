// ============================================================
// XORA — 404 Not Found Page
// frontend/src/pages/NotFoundPage.jsx
// ============================================================

import React from "react";
import { useRouter } from "../context/RouterContext";
import { useAuth } from "../context/AuthContext";
import { PageContainer, GlassPanel, PrimaryButton, OutlineButton } from "../components";
import { IconCompass, IconArrowRight } from "../components/Icons";

export default function NotFoundPage() {
  const { navigate, currentPath } = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <PageContainer maxWidth="narrow">
      <GlassPanel style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
          <IconCompass size={44} />
        </div>
        <p
          style={{
            fontSize: "3.5rem",
            fontWeight: 800,
            lineHeight: 1,
            margin: "0 0 0.5rem 0",
            color: "var(--color-brand, var(--color-primary))",
          }}
        >
          404
        </p>
        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
          Halaman Tidak Ditemukan
        </h1>
        <p className="page-description" style={{ marginBottom: "1.5rem" }}>
          Halaman <code>{currentPath}</code> tidak tersedia atau sudah dipindahkan.
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
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
