// ============================================================
// XORA — DataTable generik (gaya Datadog: 28px, mono header)
// frontend/src/components/ui/DataTable.jsx
// ============================================================

import React from "react";
import Skeleton from "./Skeleton";

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  responsive = true,
  empty = null,
  rowKey = (row, index) => index,
  className = "",
}) {
  if (loading) {
    return (
      <div className={["ui-table-wrap", className].filter(Boolean).join(" ")}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="table-row" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return empty || null;
  }

  return (
    <div className="ui-table-scroll">
      <table className={["ui-table", responsive ? "ui-table-responsive" : "", className].filter(Boolean).join(" ")}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.align === "right" ? { textAlign: "right" } : undefined}
                {...(col.align === "right" ? { "data-align": "right" } : {})}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((col) => {
                const cell = typeof col.render === "function" ? col.render(row, i) : row[col.key];
                const cls = [
                  "ui-table-cell",
                  col.align === "right" ? "ui-cell-num" : "",
                  col.strong ? "ui-cell-strong" : "",
                  col.actions ? "ui-cell-actions" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <td key={col.key} data-label={col.label} className={cls}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}