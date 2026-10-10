// ============================================================
// XORA — Pill status otomatis berdasar kode (gap/action/type)
// frontend/src/components/ui/StatusPill.jsx
// ============================================================

import React from "react";
import Badge from "./Badge";
import {
  gapStatusMeta,
  actionStatusMeta,
  practiceTypeMeta,
  difficultyMeta,
} from "../../lib/statusMaps";

export default function StatusPill({ kind = "gap", status }) {
  let meta = { label: status || "-", tone: "neutral" };
  if (kind === "gap") meta = gapStatusMeta(status);
  else if (kind === "action") meta = actionStatusMeta(status);
  else if (kind === "practice") meta = practiceTypeMeta(status);
  else if (kind === "difficulty") meta = difficultyMeta(status);

  return (
    <Badge variant={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}