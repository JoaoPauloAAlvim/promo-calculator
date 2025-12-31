"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "../components/Spinner";
import { AppHeader } from "../components/AppHeader";
import { entradaLabels } from "@/lib/entradaLabels";

type Resultado = {
  entrada?: Record<string, any>;
  metas?: Record<string, any>;
};

type HistoricoItem = {
  id: number;
  dataHora: string;
  resultado: Resultado;
};

const parseISODateLocal = (iso?: string): Date | null => {
  if (!iso) return null;
  if (typeof iso !== "string") return null;

  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

  return new Date(y, mo - 1, d); // LOCAL, sem UTC shift
};


const formatBR = (valor: number | undefined): string => {
  if (valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateBR = (value: string | Date | undefined): string => {
  if (!value) return "—";

  // Se for string ISO (YYYY-MM-DD), parse como local
  if (typeof value === "string") {
    const dLocal = parseISODateLocal(value);
    if (!dLocal) return "—";
    return dLocal.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Se for Date normal
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};


const formatPctBR = (v: number | null | undefined): string => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (
    (v * 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + "%"
  );
};


// dias inclusivos (igual na Home): (fim - início) + 1
const calcDiasPromoInclusivo = (dataInicio?: string, dataFim?: string): number | null => {
  const inicio = parseISODateLocal(dataInicio);
  const fim = parseISODateLocal(dataFim);
  if (!inicio || !fim) return null;

  const diffMs = fim.getTime() - inicio.getTime();
  if (diffMs < 0) return null;

  return diffMs / (1000 * 60 * 60 * 24) + 1;
};


export default function HistoricoPage() {
  const router = useRouter();

  const [itens, setItens] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<HistoricoItem | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [filtroStatusPromo, setFiltroStatusPromo] = useState<string>("");
  const [reloadToken, setReloadToken] = useState(0);
  const [dreAberto, setDreAberto] = useState(false);

  // filtros -> backend
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroProdutoDigitado, setFiltroProdutoDigitado] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroComprador, setFiltroComprador] = useState("");

  // filtro local por status da análise
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  // paginação
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // campos para análise da promoção encerrada
  const [qtdVendida, setQtdVendida] = useState<string>("");
  const [analisePromo, setAnalisePromo] = useState<{
    lucroHistPeriodo: number;
    lucroRealPromo: number;
    diff: number;
    situacao: "ACIMA" | "ABAIXO" | "IGUAL";
  } | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setFiltroProduto(filtroProdutoDigitado.trim());
    }, 1000);

    return () => clearTimeout(handle);
  }, [filtroProdutoDigitado]);

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
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const url = `/api/historico?${params.toString()}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          setErro(data?.error || "Erro ao carregar histórico no servidor.");
          setItens([]);
          setHasMore(false);
          setTotalCount(0);
          return;
        }
        setItens(Array.isArray(data.itens) ? data.itens : []);
        setHasMore(Boolean(data.hasMore));
        setTotalCount(
          typeof data.totalCount === "number" ? data.totalCount : 0
        );
      } catch (e) {
        console.error(e);
        setErro("Erro ao buscar histórico. Verifique a conexão.");
        setItens([]);
        setHasMore(false);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [
    filtroProduto,
    filtroMarca,
    filtroCategoria,
    filtroComprador,
    page,
    reloadToken,
  ]);

  // selects – opções derivadas
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

  const itensFiltrados = itens.filter((item) => {
    // ----- filtro por status da ANÁLISE -----
    if (filtroStatus) {
      const vendaReal = item.resultado?.metas?.venda_real as
        | { situacao?: string }
        | undefined;
      const sitAnalise = vendaReal?.situacao?.toUpperCase?.() ?? null;

      if (filtroStatus === "PENDENTE") {
        if (sitAnalise) return false;
      } else {
        if (sitAnalise !== filtroStatus) return false;
      }
    }

    // ----- filtro por status da PROMOÇÃO -----
    if (filtroStatusPromo) {
      const e = item.resultado.entrada ?? {};
      const dataInicioPromoStr = e.data_inicio_promocao as string | undefined;
      const dataFimPromoStr = e.data_fim_promocao as string | undefined;

      let promoStatus:
        | "SEM_DATAS"
        | "NAO_INICIOU"
        | "EM_ANDAMENTO"
        | "ENCERRADA" = "SEM_DATAS";

      if (dataInicioPromoStr && dataFimPromoStr) {
        const hoje = new Date();
        const hojeDia = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          hoje.getDate()
        );

        const inicioDate = new Date(dataInicioPromoStr);
        const fimDate = new Date(dataFimPromoStr);

        const inicioDia = new Date(
          inicioDate.getFullYear(),
          inicioDate.getMonth(),
          inicioDate.getDate()
        );
        const fimDia = new Date(
          fimDate.getFullYear(),
          fimDate.getMonth(),
          fimDate.getDate()
        );

        if (hojeDia < inicioDia) promoStatus = "NAO_INICIOU";
        else if (hojeDia > fimDia) promoStatus = "ENCERRADA";
        else promoStatus = "EM_ANDAMENTO";
      }

      if (promoStatus !== filtroStatusPromo) return false;
    }

    return true;
  });

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

      setItens((prev) => {
        const novaLista = prev.filter((item) => item.id !== id);

        if (novaLista.length === 0 && page > 1) {
          setPage((p) => Math.max(1, p - 1));
        }

        return novaLista;
      });

      setTotalCount((prevTotal) => Math.max(0, prevTotal - 1));
      setSelecionado((atual) => (atual?.id === id ? null : atual));
      setReloadToken((t) => t + 1);
    } catch (e) {
      console.error(e);
      alert("Erro inesperado ao excluir.");
    } finally {
      setExcluindoId(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      router.push("/login");
    }
  }

  const nomeProdutoSelecionado =
    (selecionado?.resultado as any)?.entrada?.produto_nome ??
    (selecionado?.resultado as any)?.entrada?.produto ??
    "";

  async function avaliarResultado() {
    if (!selecionado) return;

    const e = selecionado.resultado.entrada || {};
    const m = selecionado.resultado.metas || {};

    const qtd = Number(qtdVendida.trim().replace(/\./g, "").replace(",", "."));
    if (!qtd || Number.isNaN(qtd) || qtd <= 0) {
      alert("Informe uma quantidade total vendida válida (maior que zero).");
      return;
    }

    const lucroDiarioHist = Number(e.lucro_diario_hist);

    // Duração: prioriza cálculo pelas datas (igual Home); fallback para C salvo
    const dataInicio = e.data_inicio_promocao as string | undefined;
    const dataFim = e.data_fim_promocao as string | undefined;
    const diasPromoCalc = calcDiasPromoInclusivo(dataInicio, dataFim);
    const diasPromoFallback = Number(e.C ?? e.c);
    const diasPromo =
      diasPromoCalc ??
      (Number.isFinite(diasPromoFallback) ? diasPromoFallback : NaN);

    const lucroUnitPromo = Number(m.lucro_unitario_promo);

    if (
      !Number.isFinite(lucroDiarioHist) ||
      !Number.isFinite(diasPromo) ||
      !Number.isFinite(lucroUnitPromo)
    ) {
      alert(
        "Não foi possível calcular a análise para esta simulação. Verifique se a duração (datas/C), o lucro diário histórico e o lucro unitário foram calculados corretamente."
      );
      return;
    }

    const lucroHistPeriodo = lucroDiarioHist * diasPromo;
    const lucroRealPromo = lucroUnitPromo * qtd;
    const diff = lucroRealPromo - lucroHistPeriodo;

    const EPS = 0.01;
    let situacao: "ACIMA" | "ABAIXO" | "IGUAL";
    if (diff > EPS) situacao = "ACIMA";
    else if (diff < -EPS) situacao = "ABAIXO";
    else situacao = "IGUAL";

    setAnalisePromo({ lucroHistPeriodo, lucroRealPromo, diff, situacao });

    try {
      await fetch(`/api/historico/${selecionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qtdVendida: qtd,
          lucroHistPeriodo,
          lucroRealPromo,
          diff,
          situacao,
        }),
      });
    } catch (err) {
      console.error(err);
      alert("A análise foi calculada, mas não foi possível salvar no banco.");
    }
  }

  function abrirModal(item: HistoricoItem) {
    setDreAberto(false);
    setSelecionado(item);

    const vendaReal = item.resultado?.metas?.venda_real as
      | {
        qtd_vendida?: number;
        lucro_hist_periodo?: number;
        lucro_real_promo?: number;
        diff?: number;
        situacao?: "ACIMA" | "ABAIXO" | "IGUAL";
      }
      | undefined;

    if (
      vendaReal &&
      vendaReal.qtd_vendida &&
      !Number.isNaN(vendaReal.qtd_vendida)
    ) {
      setQtdVendida(String(vendaReal.qtd_vendida));
      setAnalisePromo({
        lucroHistPeriodo: Number(vendaReal.lucro_hist_periodo || 0),
        lucroRealPromo: Number(vendaReal.lucro_real_promo || 0),
        diff: Number(vendaReal.diff || 0),
        situacao:
          (vendaReal.situacao as "ACIMA" | "ABAIXO" | "IGUAL") || "IGUAL",
      });
    } else {
      setQtdVendida("");
      setAnalisePromo(null);
    }
  }
const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader
        title="Histórico de Simulações"
        rightSlot={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "12px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                }}
              >
                Simulador
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "6px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor: "#ff0000ff",
                color: "#ffffffff",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Sair
            </button>
          </div>
        }
      />

      {!loading && (
        <main className="max-w-5xl mx-auto px-4 pt-8 pb-16 space-y-6">
          {erro && (
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
                  setFiltroProdutoDigitado("");
                  setFiltroMarca("");
                  setFiltroCategoria("");
                  setFiltroComprador("");
                  setFiltroStatus("");
                  setFiltroStatusPromo("");
                  setPage(1);
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
                  value={filtroProdutoDigitado}
                  onChange={(e) => setFiltroProdutoDigitado(e.target.value)}
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
                  onChange={(e) => {
                    setFiltroMarca(e.target.value);
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setFiltroCategoria(e.target.value);
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setFiltroComprador(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    borderRadius: "10px",
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

            {/* Status da promoção */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#6b7280",
                }}
              >
                Status da promoção
              </label>
              <select
                value={filtroStatusPromo}
                onChange={(e) => setFiltroStatusPromo(e.target.value)}
                style={{
                  minWidth: "180px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "4px 10px",
                  fontSize: "12px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <option value="">Todas</option>
                <option value="NAO_INICIOU">Não iniciadas</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="ENCERRADA">Encerradas</option>
                <option value="SEM_DATAS">Sem datas</option>
              </select>
            </div>
          </section>

          <br />

          {/* Lista */}
          {!erro && itens.length === 0 && (
            <p className="text-sm text-slate-600">Nenhuma simulação encontrada.</p>
          )}

          {!erro && itens.length > 0 && itensFiltrados.length === 0 && (
            <p className="text-sm text-slate-600">
              Nenhuma simulação encontrada para esse status de análise.
            </p>
          )}

          {!erro && itensFiltrados.length > 0 && (
            <>
              <div className="cards-historico-grid">
                {itensFiltrados.map((item) => {
                  const entrada = item.resultado?.entrada ?? {};
                  const metas = item.resultado?.metas ?? {};

                  const nomeProduto =
                    (entrada as any)?.produto_nome ??
                    (entrada as any)?.produto ??
                    "";

                  const lucroMedio =
                    metas?.lucro_med_dia ?? metas?.lucro_medio_diario_promo;

                  const metaDia = metas?.meta_unid_dia;

                  const vendaReal = metas?.venda_real as
                    | { situacao?: string }
                    | undefined;

                  const sit = vendaReal?.situacao?.toUpperCase?.() ?? null;

                  const eCard = item.resultado.entrada ?? {};
                  const dataInicioPromoStr = eCard.data_inicio_promocao as
                    | string
                    | undefined;
                  const dataFimPromoStr = eCard.data_fim_promocao as
                    | string
                    | undefined;

                  let promoStatusCard:
                    | "SEM_DATAS"
                    | "NAO_INICIOU"
                    | "EM_ANDAMENTO"
                    | "ENCERRADA" = "SEM_DATAS";

                  if (dataInicioPromoStr && dataFimPromoStr) {
                    const inicioDate = parseISODateLocal(dataInicioPromoStr);
                    const fimDate = parseISODateLocal(dataFimPromoStr);

                    if (!inicioDate || !fimDate) {
                      promoStatusCard = "SEM_DATAS";
                    } else {
                      const hoje = new Date();
                      const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

                      const inicioDia = new Date(
                        inicioDate.getFullYear(),
                        inicioDate.getMonth(),
                        inicioDate.getDate()
                      );
                      const fimDia = new Date(
                        fimDate.getFullYear(),
                        fimDate.getMonth(),
                        fimDate.getDate()
                      );

                      if (hojeDia < inicioDia) promoStatusCard = "NAO_INICIOU";
                      else if (hojeDia > fimDia) promoStatusCard = "ENCERRADA";
                      else promoStatusCard = "EM_ANDAMENTO";
                    }
                  }

                  // Mapeia para label e cores
                  let promoLabel = "Sem datas";
                  let promoBg = "#f3f4f6";
                  let promoColor = "#4b5563";
                  let promoBorder = "#e5e7eb";

                  if (promoStatusCard === "NAO_INICIOU") {
                    promoLabel = "Não iniciada";
                    promoBg = "#eff6ff";
                    promoColor = "#1d4ed8";
                    promoBorder = "#bfdbfe";
                  } else if (promoStatusCard === "EM_ANDAMENTO") {
                    promoLabel = "Em andamento";
                    promoBg = "#ecfeff";
                    promoColor = "#0e7490";
                    promoBorder = "#a5f3fc";
                  } else if (promoStatusCard === "ENCERRADA") {
                    promoLabel = "Encerrada";
                    promoBg = "#fef2f2";
                    promoColor = "#b91c1c";
                    promoBorder = "#fecaca";
                  }

                  let statusLabel = "Pendente de análise";
                  let statusBg = "#f3f4f6";
                  let statusColor = "#4b5563";
                  let statusBorder = "#e5e7eb";

                  if (sit === "ACIMA") {
                    statusLabel = "Analisada – ACIMA";
                    statusBg = "#ecfdf3";
                    statusColor = "#047857";
                    statusBorder = "#6ee7b7";
                  } else if (sit === "ABAIXO") {
                    statusLabel = "Analisada – ABAIXO";
                    statusBg = "#fef2f2";
                    statusColor = "#b91c1c";
                    statusBorder = "#fecaca";
                  } else if (sit === "IGUAL") {
                    statusLabel = "Analisada – IGUAL";
                    statusBg = "#fffbeb";
                    statusColor = "#92400e";
                    statusBorder = "#fcd34d";
                  }


                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => abrirModal(item)}
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

                      {/* lucro/meta + status */}
                      <div className="mt-1 flex flex-col gap-1 text-[11px] text-slate-600 pr-5">
                        {lucroMedio !== undefined &&
                          !Number.isNaN(lucroMedio) && (
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

                        {/* Status da análise */}
                        <span
                          style={{
                            marginTop: "2px",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: 600,
                            backgroundColor: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusBorder}`,
                            alignSelf: "flex-start",
                          }}
                        >
                          {statusLabel}
                        </span>

                        {/* chip de status da promoção */}
                        <span
                          style={{
                            marginTop: "2px",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: 600,
                            backgroundColor: promoBg,
                            color: promoColor,
                            border: `1px solid ${promoBorder}`,
                            alignSelf: "flex-start",
                          }}
                        >
                          {promoLabel}
                        </span>
                      </div>

                      <span className="mt-1 ml-auto text-slate-400 text-sm transition-transform group-hover:translate-x-0.5">
                        ▸
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Paginação */}
              {/* Paginação */}
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                  {totalCount > 0 ? (
                    <>
                      Página {page} de {totalPages} – exibindo {itensFiltrados.length} de {totalCount} registro
                      {totalCount === 1 ? "" : "s"}
                    </>
                  ) : (
                    "Nenhuma simulação encontrada."
                  )}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Primeira */}
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    style={{
                      fontSize: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      padding: "4px 10px",
                      backgroundColor: page === 1 ? "#f3f4f6" : "#ffffff",
                      color: page === 1 ? "#9ca3af" : "#4b5563",
                      cursor: page === 1 ? "default" : "pointer",
                    }}
                  >
                    ⏮ Primeira
                  </button>

                  {/* Anterior */}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      fontSize: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      padding: "4px 10px",
                      backgroundColor: page === 1 ? "#f3f4f6" : "#ffffff",
                      color: page === 1 ? "#9ca3af" : "#4b5563",
                      cursor: page === 1 ? "default" : "pointer",
                    }}
                  >
                    ◀ Anterior
                  </button>

                  {/* Próxima */}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={{
                      fontSize: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      padding: "4px 10px",
                      backgroundColor: page >= totalPages ? "#f3f4f6" : "#ffffff",
                      color: page >= totalPages ? "#9ca3af" : "#4b5563",
                      cursor: page >= totalPages ? "default" : "pointer",
                    }}
                  >
                    Próxima ▶
                  </button>

                  {/* Última */}
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    style={{
                      fontSize: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      padding: "4px 10px",
                      backgroundColor: page >= totalPages ? "#f3f4f6" : "#ffffff",
                      color: page >= totalPages ? "#9ca3af" : "#4b5563",
                      cursor: page >= totalPages ? "default" : "pointer",
                    }}
                  >
                    Última ⏭
                  </button>
                </div>
              </div>

            </>
          )}
        </main>
      )}

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
              onClick={() => {
                setDreAberto(false);
                setSelecionado(null);
              }}
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

              // Datas + duração (como na Home)
              const dataInicioPromoStr = e.data_inicio_promocao as
                | string
                | undefined;
              const dataFimPromoStr = e.data_fim_promocao as string | undefined;

              const diasPromoCalc = calcDiasPromoInclusivo(
                dataInicioPromoStr,
                dataFimPromoStr
              );
              const diasPromoFallback = Number(e.C ?? e.c);
              const diasPromoFinal =
                diasPromoCalc ??
                (Number.isFinite(diasPromoFallback) ? diasPromoFallback : null);

              // Não mostrar datas/C nos “dados informados” (vamos mostrar em cards próprios)
              const entradaEntries = Object.entries(e).filter(
                ([chave, valor]) =>
                  valor !== undefined &&
                  valor !== null &&
                  chave !== "lucro_diario_hist" &&
                  chave !== "produto_nome" &&
                  chave !== "produto" &&
                  chave !== "categoria" &&
                  chave !== "comprador" &&
                  chave !== "marca" &&
                  chave !== "data_inicio_promocao" &&
                  chave !== "data_fim_promocao" &&
                  chave !== "C" &&
                  chave !== "c"
              );

              const nomeProdutoEntrada =
                (e as any).produto_nome ?? (e as any).produto ?? "";

              const categoria = e.categoria ?? "";
              const comprador = e.comprador ?? "";
              const marca = e.marca ?? "";

              // ==============================
              // CONTROLE DE STATUS DA PROMOÇÃO
              // ==============================
              let promoStatus:
                | "SEM_DATAS"
                | "NAO_INICIOU"
                | "EM_ANDAMENTO"
                | "ENCERRADA" = "SEM_DATAS";

              if (dataInicioPromoStr && dataFimPromoStr) {
                const inicioDate = parseISODateLocal(dataInicioPromoStr);
                const fimDate = parseISODateLocal(dataFimPromoStr);

                if (!inicioDate || !fimDate) {
                  promoStatus = "SEM_DATAS";
                } else {
                  const hoje = new Date();
                  const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

                  const inicioDia = new Date(
                    inicioDate.getFullYear(),
                    inicioDate.getMonth(),
                    inicioDate.getDate()
                  );
                  const fimDia = new Date(
                    fimDate.getFullYear(),
                    fimDate.getMonth(),
                    fimDate.getDate()
                  );

                  if (hojeDia < inicioDia) promoStatus = "NAO_INICIOU";
                  else if (hojeDia > fimDia) promoStatus = "ENCERRADA";
                  else promoStatus = "EM_ANDAMENTO";
                }
              }

              const podeAvaliar =
                !analisePromo &&
                (promoStatus === "ENCERRADA" || promoStatus === "SEM_DATAS");


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

                      <button
                        type="button"
                        onClick={() => setDreAberto(true)}
                        style={{
                          marginTop: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "10px",
                          border: "1px solid #d1d5db",
                          padding: "4px 10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: "#ffffff",
                          color: "#4b5563",
                          cursor: "pointer",
                        }}
                      >
                        Ver detalhes ▸
                      </button>
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

                  {/* Período + duração da promoção */}
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
                        Período da promoção
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {formatDateBR(dataInicioPromoStr)}{" "}
                        <span style={{ color: "#6b7280", fontWeight: 600 }}>
                          até
                        </span>{" "}
                        {formatDateBR(dataFimPromoStr)}
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
                        Duração da promoção
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {diasPromoFinal !== null ? (
                          <>
                            {Math.round(diasPromoFinal)}{" "}
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 400,
                                color: "#6b7280",
                              }}
                            >
                              dias{" "}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </p>

                      {dataInicioPromoStr &&
                        dataFimPromoStr &&
                        diasPromoCalc === null && (
                          <p
                            style={{
                              marginTop: "4px",
                              fontSize: "10px",
                              color: "#b91c1c",
                              fontWeight: 600,
                            }}
                          >
                            Datas inválidas (fim antes do início).
                          </p>
                        )}
                    </div>
                  </div>

                  {/* MODAL DRE (separado) */}
                  {selecionado &&
                    dreAberto &&
                    (() => {
                      const e = selecionado.resultado.entrada ?? {};
                      const m = selecionado.resultado.metas ?? {};

                      const precoPromo = Number(e.D ?? e.d);
                      const custoUnit = Number(e.E ?? e.e);
                      const receitaAdic = Number(e.F ?? e.f ?? 0);

                      const lucroSemAdic =
                        m.lucro_unitario_sem_adicional !== undefined
                          ? Number(m.lucro_unitario_sem_adicional)
                          : precoPromo - custoUnit;

                      const lucroComAdic =
                        m.lucro_unitario_com_adicional !== undefined
                          ? Number(m.lucro_unitario_com_adicional)
                          : lucroSemAdic + receitaAdic;

                      const markupComAdic =
                        m.markup_com_adicional !== undefined
                          ? (m.markup_com_adicional as number | null)
                          : custoUnit > 0
                            ? lucroComAdic / custoUnit
                            : null;


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
                            zIndex: 80,
                          }}
                          onClick={() => setDreAberto(false)}
                        >
                          <div
                            style={{
                              backgroundColor: "#ffffff",
                              borderRadius: "16px",
                              maxWidth: "640px",
                              width: "100%",
                              padding: "18px",
                              position: "relative",
                              border: "1px solid #e5e7eb",
                              boxShadow:
                                "0 20px 25px -5px rgba(0,0,0,0.15)",
                            }}
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setDreAberto(false)}
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

                            <p
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#111827",
                                marginBottom: "10px",
                              }}
                            >
                              DRE unitário (por unidade)
                            </p>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(2, minmax(0, 1fr))",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  borderRadius: "12px",
                                  border: "1px solid #e5e7eb",
                                  backgroundColor: "#f9fafb",
                                  padding: "10px",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Receita
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                    color: "#111827",
                                  }}
                                >
                                  <span>Preço promocional</span>
                                  <strong>{`R$ ${formatBR(precoPromo)}`}</strong>
                                </div>
                              </div>

                              <div
                                style={{
                                  borderRadius: "12px",
                                  border: "1px solid #e5e7eb",
                                  backgroundColor: "#f9fafb",
                                  padding: "10px",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Custos
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                    color: "#111827",
                                  }}
                                >
                                  <span>(-) Custo unitário</span>
                                  <strong>{`R$ ${formatBR(custoUnit)}`}</strong>
                                </div>
                              </div>

                              <div
                                style={{
                                  borderRadius: "12px",
                                  border: "1px solid #e5e7eb",
                                  backgroundColor: "#f9fafb",
                                  padding: "10px",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Receitas adicionais
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                  }}
                                >
                                  <span>(+) Verba / rebate</span>
                                  <strong style={{ color: "#047857" }}>
                                    {`R$ ${formatBR(receitaAdic)}`}
                                  </strong>
                                </div>
                              </div>

                              <div
                                style={{
                                  borderRadius: "12px",
                                  border: "1px solid #e5e7eb",
                                  backgroundColor: "#f9fafb",
                                  padding: "10px",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Resultado
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                    color: "#111827",
                                  }}
                                >
                                  <span>Lucro (sem adicional)</span>
                                  <strong
                                    style={{
                                      color:
                                        lucroSemAdic >= 0
                                          ? "#111827"
                                          : "#b91c1c",
                                    }}
                                  >
                                    {`R$ ${formatBR(lucroSemAdic)}`}
                                  </strong>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                    marginTop: "6px",
                                  }}
                                >
                                  <span>Lucro (com adicional)</span>
                                  <strong
                                    style={{
                                      color:
                                        lucroComAdic >= 0
                                          ? "#047857"
                                          : "#b91c1c",
                                    }}
                                  >
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
                                <p
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Markup (com adicional)
                                </p>

                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "12px",
                                    color: "#111827",
                                  }}
                                >
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
                      );
                    })()}

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

                      {/* Demais campos (sem datas e sem C) */}
                      {entradaEntries.map(([chave, valor]) => {
                        const label =
                          entradaLabels[chave as keyof typeof entradaLabels] ??
                          chave.replace(/_/g, " ");

                        const isNumero = typeof valor === "number";
                        const valorFormatado =
                          valor === undefined || valor === null
                            ? "—"
                            : isNumero
                              ? chave === "A"
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

                  {/* BLOCO: Análise após encerramento da promoção */}
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "10px",
                      borderTop: "1px dashed #e5e7eb",
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
                      Análise após encerramento da promoção
                    </p>

                    {promoStatus === "NAO_INICIOU" && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Promoção ainda não começou. A análise só ficará disponível após a
                        data de fim.
                      </p>
                    )}

                    {promoStatus === "EM_ANDAMENTO" && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Promoção em andamento. Só é possível lançar o resultado após a data
                        de fim.
                      </p>
                    )}

                    {podeAvaliar && (
                      <>
                        <div style={{ marginBottom: "8px" }}>
                          <label
                            style={{
                              display: "block",
                              fontSize: "11px",
                              fontWeight: 500,
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Quantidade TOTAL vendida na promoção
                          </label>
                          <input
                            type="text"
                            value={qtdVendida}
                            onChange={(ev) => setQtdVendida(ev.target.value)}
                            placeholder="Ex: 620"
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

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginBottom: "10px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={avaliarResultado}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "10px",
                              border: "none",
                              backgroundColor: "#4f46e5",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Avaliar resultado da promoção
                          </button>
                        </div>
                      </>
                    )}

                    {analisePromo && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: "8px",
                          marginTop: "4px",
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
                            Lucro histórico no período
                          </p>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {`R$ ${formatBR(analisePromo.lucroHistPeriodo)}`}
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
                            Lucro REAL na promoção
                          </p>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {`R$ ${formatBR(analisePromo.lucroRealPromo)}`}
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
                            Diferença vs histórico
                          </p>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color:
                                analisePromo.diff > 0
                                  ? "#047857"
                                  : analisePromo.diff < 0
                                    ? "#b91c1c"
                                    : "#111827",
                            }}
                          >
                            {`${analisePromo.diff >= 0 ? "+" : ""}R$ ${formatBR(
                              analisePromo.diff
                            )}`}
                          </p>
                        </div>

                        <div
                          style={{
                            gridColumn: "1 / -1",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            backgroundColor:
                              analisePromo.situacao === "ACIMA"
                                ? "#ecfdf3"
                                : analisePromo.situacao === "ABAIXO"
                                  ? "#fef2f2"
                                  : "#fffbeb",
                            padding: "8px 10px",
                            marginTop: "4px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color:
                                analisePromo.situacao === "ACIMA"
                                  ? "#047857"
                                  : analisePromo.situacao === "ABAIXO"
                                    ? "#b91c1c"
                                    : "#92400e",
                            }}
                          >
                            {analisePromo.situacao === "ACIMA" &&
                              "📈 Promoção ACIMA do histórico de lucro."}
                            {analisePromo.situacao === "ABAIXO" &&
                              "📉 Promoção ABAIXO do histórico de lucro."}
                            {analisePromo.situacao === "IGUAL" &&
                              "⚖ Promoção IGUAL ao histórico de lucro."}
                          </p>
                        </div>
                      </div>
                    )}
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
