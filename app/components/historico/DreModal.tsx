"use client";

import React, { useMemo, useRef } from "react";
import { formatBR, formatPctBR } from "@/lib/format";
import { useModalA11y } from "@/app/hooks/useModalA11y";

type Props = {
  open: boolean;
  onClose: () => void;

  entrada: Record<string, any> | undefined;
  metas: Record<string, any> | undefined;
};

export function DreModal({ open, onClose, entrada, metas }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useModalA11y({
    open,
    focusRef: closeRef,
    onEnter: onClose,
    onEscape: onClose,
  });

  const e = entrada ?? {};
  const m = metas ?? {};

  const precoPromo = Number(e.D ?? e.d);
  const custoUnit = Number(e.E ?? e.e);
  const receitaAdic = Number(e.F ?? e.f ?? 0);

  const lucroSemAdic = useMemo(() => {
    return m.lucro_unitario_sem_adicional !== undefined
      ? Number(m.lucro_unitario_sem_adicional)
      : precoPromo - custoUnit;
  }, [m, precoPromo, custoUnit]);

  const lucroComAdic = useMemo(() => {
    return m.lucro_unitario_com_adicional !== undefined
      ? Number(m.lucro_unitario_com_adicional)
      : lucroSemAdic + receitaAdic;
  }, [m, lucroSemAdic, receitaAdic]);

  const markupComAdic = useMemo(() => {
    if (m.markup_com_adicional !== undefined) return m.markup_com_adicional as number | null;
    return custoUnit > 0 ? lucroComAdic / custoUnit : null;
  }, [m, custoUnit, lucroComAdic]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
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
            top: "8px",
            right: "8px",
            borderRadius: "999px",
            border: "none",
            padding: "4px 8px",
            fontSize: "12px",
            backgroundColor: "#f3f4f6",
            color: "#4b5563",
            cursor: "pointer",
            zIndex: 2,
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
          <p style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
            DRE unitário (por unidade)
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "4px" }}>Receita</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#111827" }}>
                <span>Preço promocional</span>
                <strong>{`R$ ${formatBR(precoPromo)}`}</strong>
              </div>
            </div>

            <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "4px" }}>Custos</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#111827" }}>
                <span>(-) Custo unitário</span>
                <strong>{`R$ ${formatBR(custoUnit)}`}</strong>
              </div>
            </div>

            <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "4px" }}>Receitas adicionais</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span>(+) Verba / rebate</span>
                <strong style={{ color: "#047857" }}>{`R$ ${formatBR(receitaAdic)}`}</strong>
              </div>
            </div>

            <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "4px" }}>Resultado</p>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#111827" }}>
                <span>Lucro (sem adicional)</span>
                <strong style={{ color: lucroSemAdic >= 0 ? "#111827" : "#b91c1c" }}>
                  {`R$ ${formatBR(lucroSemAdic)}`}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "6px" }}>
                <span>Lucro (com adicional)</span>
                <strong style={{ color: lucroComAdic >= 0 ? "#047857" : "#b91c1c" }}>
                  {`R$ ${formatBR(lucroComAdic)}`}
                </strong>
              </div>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                padding: "10px",
              }}
            >
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "6px" }}>
                Markup (com adicional)
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#111827" }}>
                <span>Markup</span>
                <strong>{formatPctBR(markupComAdic)}</strong>
              </div>

              {custoUnit <= 0 && (
                <p style={{ marginTop: "6px", fontSize: "10px", color: "#b91c1c", fontWeight: 600 }}>
                  Não foi possível calcular markup: custo unitário é 0.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
