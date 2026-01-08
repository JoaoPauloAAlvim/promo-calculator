"use client";

import React, { useMemo, useRef, useState } from "react";
import type { HistoricoItem } from "@/lib/types";
import { parseISODateLocal, formatDateBR, calcDiasPromoInclusivo } from "@/lib/date";
import { formatBR } from "@/lib/format";
import { getPromoStatus } from "@/lib/promoStatus";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { ActionModal } from "@/app/components/ui/ActionModal";
import { patchMonitoramento } from "@/lib/api/historico";


type Props = {
  open: boolean;
  item: HistoricoItem | null;

  monData: string;
  monVendido: string;
  monEstoque: string;
  setMonVendido: (v: string) => void;
  setMonEstoque: (v: string) => void;

  onClose: () => void;

  onItemUpdated: (novo: HistoricoItem) => void;

  onReload?: () => void;
};

export function AcompanhamentoModal({
  open,
  item,
  monData,
  monVendido,
  monEstoque,
  setMonVendido,
  setMonEstoque,
  onClose,
  onItemUpdated,
  onReload,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackVariant, setFeedbackVariant] = useState<"success" | "error" | "info">("info");

  function showFeedback(opts: { title: string; message: string; variant?: "success" | "error" | "info" }) {
    setFeedbackTitle(opts.title);
    setFeedbackMsg(opts.message);
    setFeedbackVariant(opts.variant || "info");
    setFeedbackOpen(true);
  }


  const vendidoRef = useRef<HTMLInputElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useModalA11y({
    open: Boolean(open && item),
    focusRef: vendidoRef,
    onEscape: onClose,
  });

  const entrada = item?.resultado?.entrada ?? {};
  const metas = item?.resultado?.metas ?? {};

  const inicio = (entrada as any)?.data_inicio_promocao as string | undefined;
  const fim = (entrada as any)?.data_fim_promocao as string | undefined;

  const nomeProduto =
    (entrada as any)?.produto_nome ??
    (entrada as any)?.produto ??
    "";

  const vendidoNum = useMemo(() => {
    return Number(monVendido.trim().replace(/\./g, "").replace(",", "."));
  }, [monVendido]);

  const estoqueNum = useMemo(() => {
    return Number(monEstoque.trim().replace(/\./g, "").replace(",", "."));
  }, [monEstoque]);

  const snapshot = useMemo(() => {
    const D = calcDiasPromoInclusivo(inicio, fim);
    const d = calcDiasPromoInclusivo(inicio, monData);

    const Umeta = Number(metas?.meta_unid_total);
    const lucroUnit = Number(metas?.lucro_unitario_promo);

    if (!D || !d) return null;
    if (!Number.isFinite(Umeta)) return null;
    if (!Number.isFinite(vendidoNum) || vendidoNum < 0) return null;
    if (!Number.isFinite(estoqueNum) || estoqueNum < 0) return null;
    if (d < 1) return null;

    const Uesperado = (d / D) * Umeta;
    const delta = vendidoNum - Uesperado;

    const runrate = vendidoNum / d;
    const Uproj = runrate * D;
    const Lproj = Number.isFinite(lucroUnit) ? Uproj * lucroUnit : NaN;

    const rest = D - d;
    const runrateNeeded = rest > 0 ? (Umeta - vendidoNum) / rest : 0;

    const cobertura = runrate > 0 ? estoqueNum / runrate : null;
    const riscoRuptura = cobertura !== null && cobertura < rest;

    return {
      D,
      d,
      rest,
      Umeta,
      Uesperado,
      delta,
      runrate,
      runrateNeeded,
      Uproj,
      Lproj,
      cobertura,
      riscoRuptura,
    };
  }, [inicio, fim, monData, metas, vendidoNum, estoqueNum]);

  const listaAcompanhamentos = useMemo(() => {
    const m = (item?.resultado?.metas ?? {}) as any;
    const arr = Array.isArray(m.monitoramento) ? m.monitoramento : [];
    return arr;
  }, [item]);

  if (!open || !item) return null;

  const status = getPromoStatus(inicio, fim);
  if (status !== "EM_ANDAMENTO") return null;

  async function handleSave() {
    if (!item) return;

    if (!monData || !/^\d{4}-\d{2}-\d{2}$/.test(monData)) {
      showFeedback({
        title: "Data inválida",
        message: "Data de apuração inválida (use AAAA-MM-DD).",
        variant: "error",
      });
      return;
    }

    if (!Number.isFinite(vendidoNum) || vendidoNum < 0) {
      showFeedback({
        title: "Vendido inválido",
        message: "Informe um vendido acumulado válido (>= 0).",
        variant: "error",
      });
      return;
    }

    if (!Number.isFinite(estoqueNum) || estoqueNum < 0) {
      showFeedback({
        title: "Estoque inválido",
        message: "Informe um estoque válido (>= 0).",
        variant: "error",
      });
      return;
    }

    const dApur = parseISODateLocal(monData);
    const dIni = parseISODateLocal(inicio);
    const dFim = parseISODateLocal(fim);

    if (!dApur || !dIni || !dFim || dApur < dIni || dApur > dFim) {
      showFeedback({
        title: "Data fora do período",
        message: "A data de apuração precisa estar dentro do período da promoção.",
        variant: "error",
      });
      return;
    }

    try {
      setSaving(true);

      const resp = await patchMonitoramento(item.id, {
        data: monData,
        vendido: Math.floor(vendidoNum),
        estoque: Math.floor(estoqueNum),
      });

      if (resp?.resultado) {
        onItemUpdated({ ...item, resultado: resp.resultado });
      }

      if (onReload) onReload();

      showFeedback({
        title: "Acompanhamento salvo",
        message: "Registro salvo com sucesso.",
        variant: "success",
      });
    } catch (e: any) {
      console.error(e);
      showFeedback({
        title: "Erro ao salvar",
        message: e?.message || "Erro ao salvar acompanhamento.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }


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
        zIndex: 90,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          maxWidth: "820px",
          width: "100%",
          maxHeight: "85vh",
          position: "relative",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
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
            padding: "18px",
            boxSizing: "border-box",
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
            Acompanhamento durante a promoção
          </p>
          <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px" }}>
            {nomeProduto || "Produto não informado"} • Período: {formatDateBR(inicio)} até {formatDateBR(fim)}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                Data de apuração (fixa)
              </label>
              <input
                type="date"
                value={monData}
                disabled
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f3f4f6",
                  color: "#111827",
                  boxSizing: "border-box",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                Vendido acumulado
              </label>
              <input
                ref={vendidoRef}
                type="text"
                value={monVendido}
                onChange={(ev) => setMonVendido(ev.target.value)}
                placeholder="Ex: 12"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                Estoque atual
              </label>
              <input
                type="text"
                value={monEstoque}
                onChange={(ev) => setMonEstoque(ev.target.value)}
                placeholder="Ex: 8"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "6px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: saving ? "#94a3b8" : "#0f766e",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {saving ? "Salvando…" : "Salvar acompanhamento"}
            </button>
          </div>

          {snapshot && (
            <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
              <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "8px 10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>Atraso vs meta</p>
                <p style={{ fontSize: "14px", fontWeight: 900, color: snapshot.delta >= 0 ? "#047857" : "#b91c1c" }}>
                  {snapshot.delta >= 0 ? "+" : ""}{snapshot.delta.toFixed(2)} un
                </p>
              </div>

              <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "8px 10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>Ritmo atual</p>
                <p style={{ fontSize: "14px", fontWeight: 900, color: "#111827" }}>
                  {snapshot.runrate.toFixed(2)} <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280" }}>un/dia</span>
                </p>
              </div>

              <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "8px 10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>Ritmo necessário</p>
                <p style={{ fontSize: "14px", fontWeight: 900, color: snapshot.rest > 0 && snapshot.runrateNeeded > snapshot.runrate ? "#b91c1c" : "#111827" }}>
                  {snapshot.rest > 0 ? snapshot.runrateNeeded.toFixed(2) : "—"}{" "}
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280" }}>un/dia</span>
                </p>
              </div>

              <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", padding: "8px 10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>Projeção unidades</p>
                <p style={{ fontSize: "14px", fontWeight: 900, color: "#111827" }}>
                  {snapshot.Uproj.toFixed(1)} un
                </p>
              </div>

              <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", padding: "8px 10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>Projeção lucro</p>
                <p style={{ fontSize: "14px", fontWeight: 900, color: "#111827" }}>
                  {Number.isFinite(snapshot.Lproj) ? `R$ ${formatBR(snapshot.Lproj)}` : "—"}
                </p>
              </div>

              <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: snapshot.riscoRuptura ? "#fef2f2" : "#ffffff", padding: "8px 10px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>Cobertura estoque</p>
                <p style={{ fontSize: "14px", fontWeight: 900, color: snapshot.riscoRuptura ? "#b91c1c" : "#111827" }}>
                  {snapshot.cobertura !== null ? snapshot.cobertura.toFixed(1) : "—"}{" "}
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280" }}>dias</span>
                </p>
                {snapshot.riscoRuptura && (
                  <p style={{ marginTop: "4px", fontSize: "10px", color: "#b91c1c", fontWeight: 700 }}>
                    Risco de ruptura antes do fim.
                  </p>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "6px" }}>
              Acompanhamentos salvos
            </p>

            {listaAcompanhamentos.length === 0 ? (
              <p style={{ fontSize: "11px", color: "#6b7280" }}>
                Nenhum acompanhamento salvo ainda.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {listaAcompanhamentos.slice(0, 10).map((r: any) => (
                  <div
                    key={r.data}
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      padding: "8px 10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#111827" }}>
                        {formatDateBR(r.data)}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#111827" }}>
                        Vendidos: {r.vendido} | Estoque: {r.estoque}
                      </span>
                    </div>

                    {r.criadoEm && (
                      <p style={{ marginTop: "4px", fontSize: "10px", color: "#6b7280" }}>
                        Salvo em {new Date(r.criadoEm).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ActionModal
        open={feedbackOpen}
        title={feedbackTitle}
        message={feedbackMsg}
        variant={feedbackVariant}
        onClose={() => setFeedbackOpen(false)}
        autoCloseMs={feedbackVariant === "success" ? 1500 : undefined}
      />

    </div>
  );
}
