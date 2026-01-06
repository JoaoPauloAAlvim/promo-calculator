"use client";

import { Spinner } from "../Spinner";

export default function HistoricoFallback() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.45)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <Spinner size={40} />
      <p
        style={{
          marginTop: "10px",
          fontSize: "13px",
          fontWeight: 500,
          color: "#e5e7eb",
        }}
      >
        Carregando histórico…
      </p>
    </div>
  );
}
