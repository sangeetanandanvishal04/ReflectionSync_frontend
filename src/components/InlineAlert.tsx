// src/components/InlineAlert.tsx
import React from "react";

export default function InlineAlert({ type = "error", children }: { type?: "error" | "success" | "info"; children: React.ReactNode }) {
  const bg = type === "error" ? "#fff6f6" : type === "success" ? "#f6fffa" : "#f8fafc";
  const border = type === "error" ? "#fee2e2" : type === "success" ? "#bbf7d0" : "#e2e8f0";
  const color = type === "error" ? "#991b1b" : type === "success" ? "#065f46" : "#0f172a";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, padding: 12, borderRadius: 10, color, margin: "8px 0" }}>
      {children}
    </div>
  );
}