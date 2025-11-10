// src/components/Toast.tsx
import { useEffect } from "react";

export default function Toast({ toast, onClose }: { toast: { type: "ok" | "err"; msg: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onClose(), 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const bg = toast.type === "ok" ? "#ecfdf5" : "#fff1f2";
  const color = toast.type === "ok" ? "#065f46" : "#991b1b";
  const border = toast.type === "ok" ? "1px solid rgba(6,95,70,0.06)" : "1px solid rgba(153,27,27,0.06)";

  return (
    <div style={{ position: "fixed", right: 18, top: 80, zIndex: 2000 }}>
      <div style={{ background: bg, color, border, padding: "10px 14px", borderRadius: 10, boxShadow: "0 8px 24px rgba(2,6,23,0.06)", minWidth: 220 }}>
        {toast.msg}
      </div>
    </div>
  );
}