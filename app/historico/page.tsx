"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Resultado = {
  entrada?: Record<string, any>;
  metas?: Record<string, any>;
};

type HistoricoItem = {
  id: number;
  dataHora: string;
  resultado: Resultado;
};

const formatBR = (valor: number | undefined): string => {
  if (valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function HistoricoPage() {
  const [itens, setItens] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<HistoricoItem | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const res = await fetch("/api/historico");
        const data = await res.json();
        if (!res.ok) {
          setErro(data?.error || "Erro ao carregar histórico no servidor.");
          setItens([]);
          return;
        }
        setItens(Array.isArray(data.itens) ? data.itens : []);
      } catch (e) {
        console.error(e);
        setErro("Erro ao buscar histórico. Verifique a conexão.");
        setItens([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const situacaoSelecionado = selecionado?.resultado?.metas?.situacao as
    | string
    | undefined;

  const nomeProdutoSelecionado =
    (selecionado?.resultado as any)?.entrada?.produto_nome ??
    (selecionado?.resultado as any)?.entrada?.produto ??
    "";

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
          Histórico de Simulações
        </h1>

        <Link href="/" style={{ textDecoration: "none" }}>
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
            ⬅ Voltar ao simulador
          </span>
        </Link>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-16 space-y-6">
        {loading && (
          <p className="text-sm text-slate-600">Carregando histórico…</p>
        )}

        {!loading && erro && (
          <div className="rounded-xl border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠ {erro}
          </div>
        )}

        {!loading && !erro && itens.length === 0 && (
          <p className="text-sm text-slate-600">
            Nenhuma simulação encontrada. Volte ao simulador, faça um cálculo e
            ele aparecerá aqui.
          </p>
        )}

        {/* MINI CARDS */}
        {!loading && !erro && itens.length > 0 && (
          <div className="cards-historico-grid">

            {itens.map((item) => {
              const entrada = item.resultado?.entrada ?? {};
              const metas = item.resultado?.metas ?? {};
              const situacao = metas?.situacao as string | undefined;
              const nomeProduto =
                (entrada as any)?.produto_nome ??
                (entrada as any)?.produto ??
                "";
              const lucroMedio =
                metas?.lucro_med_dia ?? metas?.lucro_medio_diario_promo;
              const metaDia = metas?.meta_unid_dia;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelecionado(item)}
                  style={{
                    borderRadius: 18,
                    width: 260,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    padding: "16px",
                    boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
                    cursor: "pointer",
                  }}
                  className="card-historico relative flex flex-col gap-2 text-left focus:outline-none"
                >

                  {/* selo situação */}
                  {situacao && (
                    <span
                      className={`absolute left-4 top-2 text-[10px] font-semibold ${situacao === "ACIMA"
                          ? "text-emerald-700"
                          : situacao === "ABAIXO"
                            ? "text-red-700"
                            : "text-amber-700"
                        }`}
                    >
                      {situacao}
                    </span>
                  )}


                  {/* data */}
                  <p className="text-[11px] text-slate-500 text-right">
                    {new Date(item.dataHora).toLocaleString("pt-BR")}
                  </p>

                  {/* produto */}
                  <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                    {nomeProduto || "Produto não informado"}
                  </p>

                  {/* chips lucro/meta */}
                  <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-slate-600">
                    {lucroMedio !== undefined && !Number.isNaN(lucroMedio) && (
                      <span className="inline-flex items-center gap-1">

                        <span>
                          Lucro/dia:{" "}
                          <strong>
                            R{" "}
                            {Number(lucroMedio).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                        </span>
                      </span>
                    )}

                    {metaDia !== undefined && !Number.isNaN(metaDia) && (
                      <span className="inline-flex items-center gap-1">

                        <span>
                          Meta/dia: <strong>{metaDia}</strong>
                        </span>
                      </span>
                    )}
                  </div>


                  {/* seta */}
                  <span className="mt-1 ml-auto text-slate-400 text-sm transition-transform group-hover:translate-x-0.5">
                    ▸
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE DETALHES */}
      {selecionado && (
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
              maxWidth: "720px",
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
              onClick={() => setSelecionado(null)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                borderRadius: "9999px",
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
                Simulação realizada em{" "}
                {new Date(selecionado.dataHora).toLocaleString("pt-BR")}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "4px",
                }}
              >
                {nomeProdutoSelecionado || "Produto não informado"}
              </p>

              {situacaoSelecionado && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor:
                      situacaoSelecionado === "ACIMA"
                        ? "#6ee7b7"
                        : situacaoSelecionado === "ABAIXO"
                          ? "#fca5a5"
                          : "#fcd34d",
                    backgroundColor:
                      situacaoSelecionado === "ACIMA"
                        ? "#ecfdf3"
                        : situacaoSelecionado === "ABAIXO"
                          ? "#fef2f2"
                          : "#fffbeb",
                    color:
                      situacaoSelecionado === "ACIMA"
                        ? "#047857"
                        : situacaoSelecionado === "ABAIXO"
                          ? "#b91c1c"
                          : "#92400e",
                  }}
                >
                  {situacaoSelecionado === "ACIMA"
                    ? " Promoção ACIMA do histórico"
                    : situacaoSelecionado === "ABAIXO"
                      ? " Promoção ABAIXO do histórico"
                      : " Promoção IGUAL ao histórico"}
                </span>
              )}
            </div>

            {(() => {
              const e = selecionado.resultado.entrada || {};
              const m = selecionado.resultado.metas || {};

              const lucroHist = Number(e.lucro_diario_hist);

              const entradaEntries = Object.entries(e).filter(
                ([chave, valor]) =>
                  valor !== undefined &&
                  valor !== null &&
                  chave !== "lucro_diario_hist"
              );

              return (
                <>
                  {/* 3 CARDS PRINCIPAIS – TODOS NA MESMA LINHA E MESMO BACKGROUND */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    {/* Lucro diário histórico */}
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
                        {`R$ ${formatBR(lucroHist)}`}
                      </p>
                    </div>

                    {/* Meta de unidades por dia */}
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
                        Meta de unidades por dia
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {m.meta_unid_dia ?? "—"}{" "}
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

                    {/* Meta de unidades no período */}
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
                        Meta de unidades no período
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {m.meta_unid_total ?? "—"}{" "}
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

                  {/* DADOS DE ENTRADA – VALOR EM NEGRITO E MESMO BACKGROUND */}
                  {entradaEntries.length > 0 && (
                    <div
                      style={{
                        marginTop: "6px",
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
                        {entradaEntries.map(([chave, valor]) => (
                          <div
                            key={chave}
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
                                textTransform: "capitalize",
                              }}
                            >
                              {chave.replace(/_/g, " ")}
                            </p>
                            <p
                              style={{
                                fontSize: "13px",
                                color: "#111827",
                                fontWeight: 700, // valor em negrito
                              }}
                            >
                              {typeof valor === "number"
                                ? formatBR(Number(valor))
                                : String(valor)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}


          </div>
        </div>
      )}
    </div>
  );
}
