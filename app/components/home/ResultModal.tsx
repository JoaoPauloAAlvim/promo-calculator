"use client";

import type { Resultado, FormState } from "@/lib/types";
import { entradaLabels } from "@/lib/entradaLabels";
import { formatBR } from "@/lib/format";

type Props = {
  result: Resultado;
  form?: FormState;
  onClose: () => void;
};

export function ResultModal({ result, form, onClose }: Props) {
  const entrada = result?.entrada ?? {};
  const metas = result?.metas ?? {};

  const nomeProduto =
    (result as any)?.entrada?.produto_nome ??
    (result as any)?.entrada?.produto ??
    form?.produto ??
    "";

  return (
    <div
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
          maxWidth: "600px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "20px",
          position: "relative",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
      >
        <button
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

        <div style={{ marginBottom: "12px" }}>
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
        </div>

        
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
            Dados informados na simulação
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "6px",
            }}
          >
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
  );
}
