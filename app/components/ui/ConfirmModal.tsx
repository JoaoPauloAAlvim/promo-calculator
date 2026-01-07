"use client";

import React, { useRef } from "react";
import { useModalA11y } from "@/app/hooks/useModalA11y";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useModalA11y({
    open,
    focusRef: confirmRef,
    onEnter: () => {
      if (!loading) onConfirm();
    },
    onEscape: () => {
      if (!loading) onClose();
    },
  });

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={() => {
        if (!loading) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 220,
        backgroundColor: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            backgroundColor: danger ? "#FEF2F2" : "#F8FAFC",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: danger ? "#B91C1C" : "#0f172a",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>
            {message}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {cancelLabel}
            </button>

            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                backgroundColor: danger ? "#dc2626" : "#0f766e",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 800,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Aguarde…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
