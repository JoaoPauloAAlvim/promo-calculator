"use client";

import { useRef } from "react";
import { useModalA11y } from "@/app/hooks/useModalA11y";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export function ErrorModal({ open, message, onClose }: Props) {
  const okRef = useRef<HTMLButtonElement | null>(null);

  useModalA11y({
    open,
    focusRef: okRef,
    onEnter: onClose,
    onEscape: onClose,
  });

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        zIndex: 60,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          maxWidth: "720px",
          width: "100%",
          maxHeight: "85vh",
          position: "relative",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            borderRadius: "999px",
            border: "none",
            padding: "3px 7px",
            fontSize: "11px",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div
          style={{
            maxHeight: "85vh",
            overflowY: "auto",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                backgroundColor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                color: "#b91c1c",
                flexShrink: 0,
                fontWeight: 700,
              }}
            >
              !
            </div>

            <div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#991b1b",
                  marginBottom: "4px",
                }}
              >
                Não foi possível concluir a simulação
              </p>

              <p style={{ fontSize: "12px", color: "#4b5563", marginBottom: "10px" }}>
                {message}
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  ref={okRef}
                  type="button"
                  onClick={onClose}
                  style={{
                    fontSize: "12px",
                    borderRadius: "999px",
                    border: "none",
                    padding: "6px 14px",
                    backgroundColor: "#b91c1c",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  OK, entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
