"use client";

import { useState } from "react";
import Link from "next/link";
import { entradaLabels } from "@/lib/entradaLabels";

type FormState = {
  produto: string;
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  F: string;
};

type Resultado = {
  entrada: Record<string, any>;
  metas: Record<string, any>;
};

const initialForm: FormState = {
  produto: "",
  A: "",
  B: "",
  C: "",
  D: "",
  E: "",
  F: "",
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campos: { id: keyof FormState; label: string; placeholder?: string }[] = [
    { id: "A", label: "Período histórico (dias)", placeholder: "Ex: 30" },
    { id: "B", label: "Lucro total histórico (R$)", placeholder: "Ex: 12.450,00" },
    { id: "C", label: "Duração da promoção (dias)", placeholder: "Ex: 7" },
    { id: "D", label: "Preço promocional (R$)", placeholder: "Ex: 4,79" },
    { id: "E", label: "Custo unitário (R$)", placeholder: "Ex: 4,45" },
    { id: "F", label: "Receita adicional (R$)", placeholder: "Ex: 0,42" },
  ];

  const entrada = result?.entrada ?? {};

  const nomeProduto =
    (result as any)?.entrada?.produto_nome ??
    (result as any)?.entrada?.produto ??
    form.produto;

  const parseBR = (valor: string): number => {
    if (!valor) return NaN;
    const limpo = valor.trim().replace(/\./g, "").replace(",", ".");
    return Number(limpo);
  };

  const formatBR = (valor: number | undefined): string => {
    if (valor === undefined || Number.isNaN(valor)) return "—";
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  async function calcular() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { produto } = form;

      if (!produto.trim()) {
        setError("Informe o nome do produto.");
        return;
      }

      const A = parseBR(form.A);
      const B = parseBR(form.B);
      const C = parseBR(form.C);
      const D = parseBR(form.D);
      const E = parseBR(form.E);
      const F = parseBR(form.F);

      const valoresNumericos = [form.A, form.B, form.C, form.D, form.E, form.F];
      const algumVazio = valoresNumericos.some((v) => v.trim() === "");
      if (algumVazio) {
        setError("Preencha todos os campos numéricos antes de calcular.");
        return;
      }

      if ([A, B, C, D, E, F].some((v) => Number.isNaN(v))) {
        setError(
          "Todos os campos numéricos devem ser válidos. Use vírgula como separador decimal (ex: 4,79)."
        );
        return;
      }

      if (A <= 0) {
        setError("O período histórico (dias) deve ser maior que zero.");
        return;
      }

      if (C <= 0) {
        setError("A duração da promoção (dias) deve ser maior que zero.");
        return;
      }

      const response = await fetch("/api/calculo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produto, A, B, C, D, E, F }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const msg =
          (data && (data.error || data.erro)) ||
          "Erro ao processar o cálculo na API.";
        setError(msg);
        return;
      }

      if (data && (data.error || data.erro)) {
        setError(data.error || data.erro);
        return;
      }

      setResult(data as Resultado);
    } catch (e) {
      console.error(e);
      setError("Ocorreu um erro inesperado ao calcular. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function fecharModal() {
    setResult(null);
    setError(null);
    setForm(initialForm);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* TOPO */}
      <header
        style={{
          backgroundColor: "#e5e7eb",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Simulador de Promoções
        </h1>

        <Link href="/historico" style={{ textDecoration: "none" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 16px",
              borderRadius: "10px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "14px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            Ver histórico
          </span>
        </Link>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* FORMULÁRIO */}
        <section
          className="bg-white shadow-md p-6 md:p-7"
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            borderRadius: "18px",
            borderWidth: "3px",
            borderStyle: "solid",
            borderColor: "#9ca3af",
            boxSizing: "border-box",
          }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2 text-center">
            Informe os dados da promoção
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mb-4 text-center">
            Use vírgula como separador decimal (ex: 4,79).
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠ {error}
            </div>
          )}

          {/* Container estreito para os campos */}
          <div
            style={{
              maxWidth: "260px",
              margin: "0 auto",
            }}
          >
            {/* Nome do produto */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Nome do produto
              </label>
              <input
                type="text"
                placeholder="Ex: CREME DENTAL COLGATE TRIPLA AÇÃO 120G"
                value={form.produto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, produto: e.target.value }))
                }
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />
            </div>

            {/* Campos numéricos */}
            {campos.map((campo) => (
              <div key={campo.id} style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {campo.label}
                </label>
                <input
                  type="text"
                  placeholder={campo.placeholder}
                  value={form[campo.id]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [campo.id]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#f9fafb",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Botão Calcular */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={calcular}
              disabled={loading}
              style={{
                marginTop: "20px",
                padding: "8px 32px",
                borderRadius: "10px",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            >
              {loading ? "Calculando..." : "Calcular ➜"}
            </button>
          </div>
        </section>
      </main>

      {/* MODAL DE RESULTADO */}
      {result && (
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
            {/* Botão fechar */}
            <button
              onClick={fecharModal}
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

            {/* Cabeçalho */}
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
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "4px",
                }}
              >
                {nomeProduto || "Produto não informado"}
              </p>
            </div>

            {/* Lucro diário histórico */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(1, minmax(0,1fr))",
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
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Lucro diário histórico
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {`R$ ${formatBR(
                    Number(result.entrada?.lucro_diario_hist)
                  )}`}
                </p>
              </div>
            </div>

            {/* Metas */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: "8px",
              }}
            >
              <div
                style={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "8px 10px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Meta de unidades por dia
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {result.metas?.meta_unid_dia ?? "—"}{" "}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 400,
                      color: "#6b7280",
                    }}
                  >
                    unid/dia
                  </span>
                </p>
              </div>

              <div
                style={{
                  borderRadius: "12px",
                  border: "1px solid#e5e7eb",
                  padding: "8px 10px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Meta de unidades no período
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {result.metas?.meta_unid_total ?? "—"}{" "}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 400,
                      color: "#6b7280",
                    }}
                  >
                    unid
                  </span>
                </p>
              </div>
            </div>

            {/* Dados informados */}
            <div
              style={{
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "6px",
                }}
              >
                Dados informados na simulação
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    padding: "6px 8px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6b7280",
                      marginBottom: "2px",
                    }}
                  >
                    Produto
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#111827",
                      fontWeight: 700,
                    }}
                  >
                    {nomeProduto || "Produto não informado"}
                  </p>
                </div>

                {(["A", "B", "C", "D", "E", "F"] as const).map((key) => {
                  const raw = entrada[key];
                  const label = entradaLabels[key] ?? key;
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
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#6b7280",
                          marginBottom: "2px",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#111827",
                          fontWeight: 700,
                        }}
                      >
                        {valor}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
