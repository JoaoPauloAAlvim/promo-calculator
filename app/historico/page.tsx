"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { entradaLabels } from "@/lib/entradaLabels";

const Spinner = ({ size = 32 }: { size?: number }) => (
  <span
    className="
      inline-block animate-spin rounded-full
      border-4 border-slate-300 border-t-indigo-500
    "
    style={{ width: size, height: size }}
  />
);

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
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  // filtros (enviados para backend)
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroComprador, setFiltroComprador] = useState("");

  // carregar histórico do backend sempre que filtros mudarem
  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const params = new URLSearchParams();
        if (filtroProduto.trim()) params.set("produto", filtroProduto.trim());
        if (filtroMarca) params.set("marca", filtroMarca);
        if (filtroCategoria) params.set("categoria", filtroCategoria);
        if (filtroComprador) params.set("comprador", filtroComprador);

        const qs = params.toString();
        const url = qs ? `/api/historico?${qs}` : "/api/historico";

        const res = await fetch(url);
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
  }, [filtroProduto, filtroMarca, filtroCategoria, filtroComprador]);

  // opções para selects (derivadas do resultado atual)
  const opcoesMarca = Array.from(
    new Set(
      itens
        .map((item) => {
          const e = item.resultado.entrada ?? {};
          return (e.marca as string | undefined)?.trim() || "";
        })
        .filter((v) => v !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

  const opcoesCategoria = Array.from(
    new Set(
      itens
        .map((item) => {
          const e = item.resultado.entrada ?? {};
          return (e.categoria as string | undefined)?.trim() || "";
        })
        .filter((v) => v !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

  const opcoesComprador = Array.from(
    new Set(
      itens
        .map((item) => {
          const e = item.resultado.entrada ?? {};
          return (e.comprador as string | undefined)?.trim() || "";
        })
        .filter((v) => v !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

  async function excluirItem(id: number) {
    try {
      setExcluindoId(id);
      const res = await fetch("/api/historico", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao excluir:", data);
        alert(data?.error || "Erro ao excluir simulação.");
        return;
      }

      setItens((prev) => prev.filter((item) => item.id !== id));
      setSelecionado((atual) => (atual?.id === id ? null : atual));
    } catch (e) {
      console.error(e);
      alert("Erro inesperado ao excluir.");
    } finally {
      setExcluindoId(null);
    }
  }

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
        {!loading && erro && (
          <div className="rounded-xl border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠ {erro}
          </div>
        )}

        {/* FILTROS */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            padding: "10px 16px",
            boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Filtros do histórico
            </p>

            <button
              type="button"
              onClick={() => {
                setFiltroProduto("");
                setFiltroMarca("");
                setFiltroCategoria("");
                setFiltroComprador("");
              }}
              style={{
                fontSize: "11px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                padding: "3px 10px",
                backgroundColor: "#f9fafb",
                color: "#4b5563",
                cursor: "pointer",
              }}
            >
              Limpar filtros
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
              columnGap: 24,
              rowGap: 8,
              alignItems: "end",
            }}
          >
            {/* Produto */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Produto
              </label>
              <input
                type="text"
                value={filtroProduto}
                onChange={(e) => setFiltroProduto(e.target.value)}
                placeholder="Ex: creme dental"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f9fafb",
                }}
              />
            </div>

            {/* Marca */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Marca
              </label>
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <option value="">Todas</option>
                {opcoesMarca.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Categoria
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <option value="">Todas</option>
                {opcoesCategoria.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Comprador */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Comprador
              </label>
              <select
                value={filtroComprador}
                onChange={(e) => setFiltroComprador(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <option value="">Todos</option>
                {opcoesComprador.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {!loading && !erro && itens.length === 0 && (
          <p className="text-sm text-slate-600">
            Nenhuma simulação encontrada.
          </p>
        )}

        {/* MINI CARDS */}
        {!loading && !erro && itens.length > 0 && (
          <div className="cards-historico-grid">
            {itens.map((item) => {
              const entrada = item.resultado?.entrada ?? {};
              const metas = item.resultado?.metas ?? {};
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
                    position: "relative",
                  }}
                  className="card-historico flex flex-col gap-2 text-left focus:outline-none"
                >
                  {/* X vermelho */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirItem(item.id);
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#dc2626",
                      fontWeight: 700,
                    }}
                  >
                    {excluindoId === item.id ? "…" : "✕"}
                  </button>

                  {/* topo: produto + data */}
                  <div className="flex items-start justify-between gap-2 pr-5">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2 flex-1">
                      {nomeProduto || "Produto não informado"}
                    </p>
                    <p className="text-[11px] text-slate-500 whitespace-nowrap text-right">
                      {new Date(item.dataHora).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  {/* lucro/meta */}
                  <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-slate-600 pr-5">
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
            </div>

            {(() => {
              const e = selecionado.resultado.entrada || {};
              const m = selecionado.resultado.metas || {};

              const lucroHist = Number(e.lucro_diario_hist);
              const lucroUnitarioPromo = m.lucro_unitario_promo;

              const entradaEntries = Object.entries(e).filter(
                ([chave, valor]) =>
                  valor !== undefined &&
                  valor !== null &&
                  chave !== "lucro_diario_hist" &&
                  chave !== "produto_nome" &&
                  chave !== "produto" &&
                  chave !== "categoria" &&
                  chave !== "comprador" &&
                  chave !== "marca"
              );

              const nomeProdutoEntrada =
                (e as any).produto_nome ?? (e as any).produto ?? "";

              const categoria = e.categoria ?? "";
              const comprador = e.comprador ?? "";
              const marca = e.marca ?? "";

              return (
                <>
                  {/* cards principais */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: "8px",
                      marginBottom: "14px",
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
                        {`R$ ${formatBR(lucroHist)}`}
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
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Lucro unitário na promoção
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {lucroUnitarioPromo !== undefined
                          ? `R$ ${formatBR(Number(lucroUnitarioPromo))}`
                          : "—"}
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

                  {/* dados de entrada */}
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
                      {/* Produto */}
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
                          {nomeProdutoEntrada || "Produto não informado"}
                        </p>
                      </div>

                      {/* Categoria */}
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
                          Categoria do produto
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#111827",
                            fontWeight: 700,
                          }}
                        >
                          {categoria || "—"}
                        </p>
                      </div>

                      {/* Comprador */}
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
                          Comprador
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#111827",
                            fontWeight: 700,
                          }}
                        >
                          {comprador || "—"}
                        </p>
                      </div>

                      {/* Marca */}
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
                          Marca
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#111827",
                            fontWeight: 700,
                          }}
                        >
                          {marca || "—"}
                        </p>
                      </div>

                      {/* Demais campos A–F */}
                      {entradaEntries.map(([chave, valor]) => {
                        const label =
                          entradaLabels[
                            chave as keyof typeof entradaLabels
                          ] ?? chave.replace(/_/g, " ");

                        const isNumero = typeof valor === "number";
                        const valorFormatado =
                          valor === undefined || valor === null
                            ? "—"
                            : isNumero
                            ? chave === "A" || chave === "C"
                              ? String(Math.round(valor as number))
                              : formatBR(Number(valor))
                            : String(valor);

                        return (
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
                              {valorFormatado}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* OVERLAY DE LOADING */}
      {loading && (
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
      )}
    </div>
  );
}
