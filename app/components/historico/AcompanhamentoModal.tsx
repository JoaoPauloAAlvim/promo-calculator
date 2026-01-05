"use client";

import React, { useMemo, useState } from "react";
import type { HistoricoItem } from "@/lib/types";
import { parseISODateLocal, formatDateBR, calcDiasPromoInclusivo } from "@/lib/date";
import { formatBR } from "@/lib/format";

type Props = {
  open: boolean;
  item: HistoricoItem | null;

  monData: string; // YYYY-MM-DD (fixa)
  monVendido: string;
  monEstoque: string;
  setMonVendido: (v: string) => void;
  setMonEstoque: (v: string) => void;

  onClose: () => void;

  /** Atualiza o item selecionado com o resultado retornado pelo PATCH */
  onItemUpdated: (novo: HistoricoItem) => void;

  /** opcional: para forçar recarga da lista */
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

  const entrada = item?.resultado?.entrada ?? {};
  const metas = item?.resultado?.metas ?? {};

  const inicio = (entrada as any)?.data_inicio_promocao as string | undefined;
  const fim = (entrada as any)?.data_fim_promocao as string | undefined;

  const nomeProduto =
    (entrada as any)?.produto_nome ??
    (entrada as any)?.produto ??
    "";

  // Normaliza número BR
  const vendidoNum = useMemo(() => {
    return Number(monVendido.trim().replace(/\./g, "").replace(",", "."));
  }, [monVendido]);

  const estoqueNum = useMemo(() => {
    return Number(monEstoque.trim().replace(/\./g, "").replace(",", "."));
  }, [monEstoque]);

  // Snapshot calculado (só para exibir)
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

  async function handleSave() {
    if (!item) return;

    if (!monData || !/^\d{4}-\d{2}-\d{2}$/.test(monData)) {
      alert("Data de apuração inválida.");
      return;
    }
    if (!Number.isFinite(vendidoNum) || vendidoNum < 0) {
      alert("Informe um vendido acumulado válido (>= 0).");
      return;
    }
    if (!Number.isFinite(estoqueNum) || estoqueNum < 0) {
      alert("Informe um estoque válido (>= 0).");
      return;
    }

    // Data precisa estar dentro do período
    const dApur = parseISODateLocal(monData);
    const dIni = parseISODateLocal(inicio);
    const dFim = parseISODateLocal(fim);

    if (!dApur || !dIni || !dFim || dApur < dIni || dApur > dFim) {
      alert("A data de apuração precisa estar dentro do período da promoção.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/historico/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monitoramento: {
            data: monData,
            vendido: Math.floor(vendidoNum),
            estoque: Math.floor(estoqueNum),
          },
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || "Erro ao salvar acompanhamento.");
        return;
      }

      if (data?.resultado) {
        onItemUpdated({ ...item, resultado: data.resultado });
      }

      if (onReload) onReload();

      alert("Acompanhamento salvo!");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          maxWidth: "820px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "18px",
          position: "relative",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <button
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
          }}
        >
          ✕
        </button>

        <p style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
          Acompanhamento durante a promoção
        </p>
        <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px" }}>
          {nomeProduto || "Produto não informado"} • Período: {formatDateBR(inicio)} até {formatDateBR(fim)}
        </p>

        {/* Inputs */}
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

        {/* Salvar */}
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

        {/* Cards */}
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

        {/* Lista */}
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
  );
}
