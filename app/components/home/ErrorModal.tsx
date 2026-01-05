"use client";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export function ErrorModal({ open, message, onClose }: Props) {
  if (!open) return null;

  return (
    <div
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
          borderRadius: "14px",
          maxWidth: "420px",
          width: "100%",
          padding: "18px 20px 16px",
          border: "1px solid #fecaca",
          boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
          position: "relative",
        }}
      >
        <button
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
  );
}
