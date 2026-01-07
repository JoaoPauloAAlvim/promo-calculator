"use client";

import React, { useRef } from "react";
import { Spinner } from "../Spinner";
import type { ResultadoLote } from "@/lib/types";
import { formatBR } from "@/lib/format";
import { useModalA11y } from "@/app/hooks/useModalA11y";

type Props = {
  open: boolean;
  onClose: () => void;

  onGenerateModel: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  importFileName: string | null;
  importLoading: boolean;
  importError: string | null;
  importResults: ResultadoLote[];
};

export function ImportModal({
  open,
  onClose,
  onGenerateModel,
  onFileChange,
  importFileName,
  importLoading,
  importError,
  importResults,
}: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useModalA11y({
    open,
    focusRef: closeRef,
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
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        zIndex: 80,
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
          ref={closeRef}
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            borderRadius: "999px",
            border: "none",
            padding: "4px 8px",
            fontSize: "12px",
            backgroundColor: "#f3f4f6",
            color: "#4b5563",
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
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
            Importar planilha Excel
          </h3>

          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
            Formato esperado: primeira aba com colunas{" "}
            <strong>
              Produto, Categoria, Comprador, Marca, PeriodoHistorico, LucroTotalHistorico, DataInicioPromocao,
              DataFimPromocao, PrecoPromocional, CustoUnitario, ReceitaAdicional
            </strong>
            . Use datas como <code>AAAA-MM-DD</code> ou <code>DD/MM/AAAA</code>.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 0" }}>
              <input
                id="file-input-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                style={{ display: "none" }}
              />

              <label
                htmlFor="file-input-excel"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  border: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Escolher arquivo
              </label>

              {importFileName && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "260px",
                  }}
                >
                  {importFileName}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onGenerateModel}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 14px",
                borderRadius: "10px",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                border: "none",
                whiteSpace: "nowrap",
              }}
            >
              Baixar modelo (.xlsx)
            </button>
          </div>

          {importError && (
            <div
              style={{
                marginTop: "4px",
                marginBottom: "8px",
                borderRadius: "10px",
                border: "1px solid #fecaca",
                backgroundColor: "#fee2e2",
                padding: "8px 10px",
                fontSize: "12px",
                color: "#b91c1c",
              }}
            >
              ⚠ {importError}
            </div>
          )}

          {importResults.length > 0 && (
            <div style={{ marginTop: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "10px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
                Resultados da simulação em lote
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>
                Linhas OK foram salvas no histórico normalmente via API de cálculo.
              </p>

              <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border px-2 py-1 text-left">Linha</th>
                      <th className="border px-2 py-1 text-left">Produto</th>
                      <th className="border px-2 py-1 text-left">Status</th>
                      <th className="border px-2 py-1 text-left">Lucro diário hist.</th>
                      <th className="border px-2 py-1 text-left">Lucro unit. promo</th>
                      <th className="border px-2 py-1 text-left">Meta unid/dia</th>
                      <th className="border px-2 py-1 text-left">Meta unid/período</th>
                      <th className="border px-2 py-1 text-left">Erro</th>
                    </tr>
                  </thead>

                  <tbody>
                    {importResults.map((r) => {
                      const entrada = r.resultado?.entrada ?? {};
                      const metas = r.resultado?.metas ?? {};

                      return (
                        <tr key={r.linha}>
                          <td className="border px-2 py-1">{r.linha}</td>
                          <td className="border px-2 py-1">{r.produto || "—"}</td>
                          <td className="border px-2 py-1">
                            {r.ok ? (
                              <span className="text-emerald-700 font-semibold">OK</span>
                            ) : (
                              <span className="text-red-700 font-semibold">FALHA</span>
                            )}
                          </td>
                          <td className="border px-2 py-1">
                            {r.ok ? `R$ ${formatBR(Number((entrada as any).lucro_diario_hist))}` : "—"}
                          </td>
                          <td className="border px-2 py-1">
                            {r.ok && metas?.lucro_unitario_promo !== undefined
                              ? `R$ ${formatBR(Number(metas.lucro_unitario_promo))}`
                              : "—"}
                          </td>
                          <td className="border px-2 py-1">
                            {r.ok && metas?.meta_unid_dia !== undefined ? metas.meta_unid_dia : "—"}
                          </td>
                          <td className="border px-2 py-1">
                            {r.ok && metas?.meta_unid_total !== undefined ? metas.meta_unid_total : "—"}
                          </td>
                          <td className="border px-2 py-1 text-red-600">{!r.ok ? r.erro : ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {importLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(255,255,255,0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
            }}
          >
            <Spinner size={32} />
            <p style={{ marginTop: "8px", fontSize: "12px", fontWeight: 500, color: "#4b5563" }}>
              Processando planilha…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
