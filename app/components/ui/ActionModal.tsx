"use client";

import React, { useEffect, useRef } from "react";
import { useModalA11y } from "@/app/hooks/useModalA11y";

type Variant = "success" | "error" | "info";

export function ActionModal({
  open,
  title,
  message,
  variant = "info",
  confirmLabel = "OK",
  onClose,
  autoCloseMs,
}: {
  open: boolean;
  title: string;
  message: string;
  variant?: Variant;
  confirmLabel?: string;
  onClose: () => void;
  autoCloseMs?: number;
}) {
  const okRef = useRef<HTMLButtonElement | null>(null);

  useModalA11y({
    open,
    focusRef: okRef,
    onEnter: onClose,
    onEscape: onClose,
  });

  useEffect(() => {
    if (!open) return;
    if (!autoCloseMs) return;

    const t = setTimeout(() => onClose(), autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  const accent =
    variant === "error"
      ? { bg: "#FEF2F2", border: "#FCA5A5", text: "#B91C1C" }
      : variant === "success"
      ? { bg: "#ECFDF5", border: "#6EE7B7", text: "#047857" }
      : { bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
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
          maxWidth: 480,
          borderRadius: 16,
          border: `1px solid ${accent.border}`,
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            backgroundColor: accent.bg,
            borderBottom: `1px solid ${accent.border}`,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: accent.text }}>
            {title}
          </div>
        </div>

        <div style={{ padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>
            {message}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              ref={okRef}
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
