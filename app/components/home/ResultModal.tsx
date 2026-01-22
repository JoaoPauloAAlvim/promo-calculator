"use client";

import type { Resultado, FormState } from "@/lib/types";
import { entradaLabels } from "@/lib/entradaLabels";
import { formatBR } from "@/lib/format";
import { useRef, useState } from "react";
import { useModalA11y } from "@/app/hooks/useModalA11y";

type Props = {
  result: Resultado;
  form?: FormState;
  onClose: () => void;
};

export function ResultModal({ result, form, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [copiado, setCopiado] = useState(false);


  useModalA11y({
    open: true,
    focusRef: closeRef,
    onEnter: onClose,
    onEscape: onClose,
  });

  const entrada = result?.entrada ?? {};
  const metas = result?.metas ?? {};

  const ipcaAplicado = Boolean((entrada as any)?.ipca_aplicado);
  const ipcaMsg = String((entrada as any)?.ipca_msg || "");

  const ipcaFatorNum = Number((entrada as any)?.ipca_fator);
  const ipcaFatorTxt =
    Number.isFinite(ipcaFatorNum)
      ? ipcaFatorNum.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 6 })
      : "—";

  const ipcaVarPctTxt =
    Number.isFinite(ipcaFatorNum)
      ? ((ipcaFatorNum - 1) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"
      : "—";

  const lucroHistIpcaNum = Number((entrada as any)?.lucro_diario_hist_ipca);

  const metaDiaIpca = (metas as any)?.meta_unid_dia_ipca;
  const metaTotIpca = (metas as any)?.meta_unid_total_ipca;

  const nomeProduto =
    (result as any)?.entrada?.produto_nome ??
    (result as any)?.entrada?.produto ??
    form?.produto ??
    "";

  function buildResumo(resultado: any) {
    const e = resultado?.entrada || {};
    const m = resultado?.metas || {};

    const linhas = [
      `PROMOÇÃO — RESUMO`,
      ``,
      `Produto: ${e.produto_nome || "—"}`,
      `Comprador: ${e.comprador || "—"}`,
      `Tipo: ${e.tipo_promocao || "—"}`,
      `Período: ${e.data_inicio_promocao || "—"} → ${e.data_fim_promocao || "—"}`,
      `Dias de Promoção: ${e.C || "—"}`,
      ``,
      `Preço promo: R$ ${String(e.D ?? "—")}`,
      `Custo: R$ ${String(e.E ?? "—")}`,
      `Reembolso/Receita: R$ ${String(e.F ?? "—")}`,
      `Lucro unitário: R$ ${m?.lucro_unitario_com_adicional != null ? formatBR(Number(m.lucro_unitario_com_adicional)) : "—"}`,
      `Meta/dia: ${m?.meta_unid_dia ?? "—"} un`,
      `Meta total: ${m?.meta_unid_total ?? "—"} un`,
      ``,
      `IPCA: ${e.ipca_msg || "Sem IPCA"}`,
      ...(e.ipca_aplicado
        ? [
          `Fator IPCA: ${e.ipca_fator ?? "—"}`,
          `Meta/dia (IPCA): ${m?.meta_unid_dia_ipca ?? "—"} un`,
          `Meta total (IPCA): ${m?.meta_unid_total_ipca ?? "—"} un`,
        ]
        : []),
    ];

    return linhas.join("\n");
  }

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
        zIndex: 50,
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
            borderRadius: "10px",
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
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Resultado da simulação
              </p>

              <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                {nomeProduto || "Produto não informado"}
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const texto = buildResumo(result);

                  if (!navigator?.clipboard?.writeText) {
                    alert("Seu navegador não permite copiar automaticamente. Tente copiar manualmente.");
                    return;
                  }

                  await navigator.clipboard.writeText(texto);

                  setCopiado(true);
                  window.setTimeout(() => setCopiado(false), 1500);
                } catch (e) {
                  console.error(e);
                  alert("Não foi possível copiar o resumo.");
                }
              }}
              style={{
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                padding: "8px 12px",
                fontSize: "12px",
                backgroundColor: "#ffffff",
                color: "#111827",
                cursor: "pointer",
                fontWeight: 700,
                whiteSpace: "nowrap",
                marginTop: "2px",
              }}
            >
              {copiado ? "Copiado!" : "Copiar resumo"}
            </button>
          </div>

          {ipcaMsg && (
            <div
              style={{
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                backgroundColor: ipcaAplicado ? "#eff6ff" : "#f9fafb",
                padding: "8px 10px",
                fontSize: "12px",
                color: "#111827",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              {ipcaMsg}
              {ipcaAplicado && Number.isFinite(ipcaFatorNum) ? (
                <span style={{ marginLeft: 6, fontWeight: 600, color: "#374151" }}>
                  (fator {ipcaFatorTxt} | {ipcaVarPctTxt})
                </span>
              ) : null}
            </div>
          )}



          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                padding: "8px 10px",
              }}
            >
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                Lucro diário histórico
              </p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                {`R$ ${formatBR(Number((entrada as any)?.lucro_diario_hist))}`}
              </p>
            </div>

            <div
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                padding: "8px 10px",
              }}
            >
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                Lucro unitário na promoção
              </p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                {metas?.lucro_unitario_promo !== undefined
                  ? `R$ ${formatBR(Number(metas.lucro_unitario_promo))}`
                  : "—"}
              </p>
            </div>

            {ipcaAplicado && (
              <>
                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#eff6ff",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Lucro diário histórico (IPCA)
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {Number.isFinite(lucroHistIpcaNum) ? `R$ ${formatBR(lucroHistIpcaNum)}` : "—"}
                  </p>
                </div>

                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#eff6ff",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Fator IPCA
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {ipcaFatorTxt} <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280" }}>({ipcaVarPctTxt})</span>
                  </p>
                </div>
              </>
            )}

          </div>

          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid #e5e7eb",
              marginBottom: "8px",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
              Detalhamento do lucro unitário (DRE por unidade)
            </p>

            {(() => {
              const precoPromo = Number((entrada as any).D ?? (entrada as any).d);
              const custoUnit = Number((entrada as any).E ?? (entrada as any).e);
              const receitaAdic = Number((entrada as any).F ?? (entrada as any).f ?? 0);

              const lucroSemAdic =
                (metas as any)?.lucro_unitario_sem_adicional !== undefined
                  ? Number((metas as any).lucro_unitario_sem_adicional)
                  : precoPromo - custoUnit;

              const lucroComAdic =
                (metas as any)?.lucro_unitario_com_adicional !== undefined
                  ? Number((metas as any).lucro_unitario_com_adicional)
                  : metas?.lucro_unitario_promo !== undefined
                    ? Number(metas.lucro_unitario_promo)
                    : lucroSemAdic + receitaAdic;

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      padding: "8px 10px",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                      Preço promocional
                    </p>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                      {`R$ ${formatBR(precoPromo)}`}
                    </p>

                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginTop: "6px", marginBottom: "4px" }}>
                      Custo unitário
                    </p>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                      {`R$ ${formatBR(custoUnit)}`}
                    </p>
                  </div>

                  <div
                    style={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      padding: "8px 10px",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                      Receita adicional (verba / rebate)
                    </p>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#047857" }}>
                      {`R$ ${formatBR(receitaAdic)}`}
                    </p>
                  </div>

                  <div
                    style={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      padding: "8px 10px",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                      Lucro unitário SEM receita adicional
                    </p>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: lucroSemAdic >= 0 ? "#111827" : "#b91c1c" }}>
                      {`R$ ${formatBR(lucroSemAdic)}`}
                    </p>

                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginTop: "6px", marginBottom: "4px" }}>
                      Lucro unitário COM receita adicional
                    </p>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: lucroComAdic >= 0 ? "#047857" : "#b91c1c" }}>
                      {`R$ ${formatBR(lucroComAdic)}`}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gap: "8px",
            }}
          >
            <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                Meta de unidades por dia
              </p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                {(metas as any)?.meta_unid_dia ?? "—"}{" "}
                <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid/dia</span>
              </p>
            </div>

            <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                Meta de unidades no período
              </p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                {(metas as any)?.meta_unid_total ?? "—"}{" "}
                <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid</span>
              </p>
            </div>

            {ipcaAplicado && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "6px" }}>
                  Metas com IPCA
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                    gap: "8px",
                  }}
                >
                  <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 10px", backgroundColor: "#eff6ff" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                      Meta de unidades por dia (IPCA)
                    </p>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                      {metaDiaIpca ?? "—"}{" "}
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid/dia</span>
                    </p>
                  </div>

                  <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 10px", backgroundColor: "#eff6ff" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                      Meta de unidades no período (IPCA)
                    </p>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                      {metaTotIpca ?? "—"}{" "}
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
              Dados informados na simulação
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px" }}>
              <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>Produto</p>
                <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                  {nomeProduto || "Produto não informado"}
                </p>
              </div>

              <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                  Categoria do produto
                </p>
                <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                  {(entrada as any).categoria || "—"}
                </p>
              </div>

              <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>Comprador</p>
                <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                  {(entrada as any).comprador || "—"}
                </p>
              </div>

              <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>Marca</p>
                <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                  {(entrada as any).marca || "—"}
                </p>
              </div>

              <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>Tipo:</p>
                <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                  {(entrada as any).tipo_promocao || "—"}
                </p>
              </div>

              {(["A", "B", "C", "D", "E", "F"] as const).map((key) => {
                const raw = (entrada as any)[key];
                const label = (entradaLabels as any)[key] ?? key;
                const isNumero = typeof raw === "number";
                const valor =
                  raw === undefined || raw === null
                    ? "—"
                    : isNumero
                      ? key === "A" || key === "C"
                        ? String(Math.round(raw))
                        : formatBR(raw)
                      : String(raw);

                return (
                  <div
                    key={key}
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      padding: "6px 8px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                      {label}
                    </p>
                    <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>{valor}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
