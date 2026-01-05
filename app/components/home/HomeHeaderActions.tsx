"use client";

import Link from "next/link";

type Props = {
  onOpenImport: () => void;
  onLogout: () => void; // aqui é "abrir confirmação"
};

export function HomeHeaderActions({ onOpenImport, onLogout }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Link href="/historico" style={{ textDecoration: "none" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 14px",
            borderRadius: "10px",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "12px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        >
          Histórico
        </span>
      </Link>

      <button
        type="button"
        onClick={onOpenImport}
        style={{
          padding: "6px 14px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: "#0f766e",
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        Importar planilha
      </button>

      <button
        type="button"
        onClick={onLogout}
        style={{
          padding: "6px 14px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          backgroundColor: "#ff0303ff",
          color: "#ffffffff",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Sair
      </button>
    </div>
  );
}
