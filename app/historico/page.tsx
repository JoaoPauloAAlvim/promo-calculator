"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "../components/Spinner";
import { AppHeader } from "../components/AppHeader";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { useHistorico } from "@/app/hooks/useHistorico";
import type { HistoricoFiltros, HistoricoItem } from "@/lib/types";
import { HistoricoPagination } from "../components/historico/HistoricoPagination";
import { HistoricoFilters } from "@/app/components/historico/HistoricoFilters";
import { HistoricoGrid } from "@/app/components/historico/HistoricoGrid";
import { HistoricoModal } from "@/app/components/historico/HistoricoModal";



export default function HistoricoPage() {
  const router = useRouter();

  const [selecionado, setSelecionado] = useState<HistoricoItem | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [filtroStatusPromo, setFiltroStatusPromo] = useState<string>("");
  const [reloadToken, setReloadToken] = useState(0);
  
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroProdutoDigitado, setFiltroProdutoDigitado] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroComprador, setFiltroComprador] = useState("");

  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const debouncedProduto = useDebouncedValue(filtroProdutoDigitado.trim(), 1000)

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
    setFiltroProduto(debouncedProduto);
  }, [debouncedProduto]);

  const filtros: HistoricoFiltros = {
    produto: filtroProduto || "",
    marca: filtroMarca || "",
    categoria: filtroCategoria || "",
    comprador: filtroComprador || "",
    statusPromo: (filtroStatusPromo || "") as any,
    statusAnalise: (filtroStatus || "") as any,
  };

  const { itens, totalCount, loading, erro } = useHistorico({
    filtros,
    page,
    pageSize,
    reloadToken,
  });


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
      setReloadToken((t) => t + 1);

      if (page > 1 && itens.length === 1) {
        setPage((p) => Math.max(1, p - 1));
      }

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

  function abrirModal(item: HistoricoItem) {
  setSelecionado(item);
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

          <HistoricoFilters
            filtroProdutoDigitado={filtroProdutoDigitado}
            filtroMarca={filtroMarca}
            filtroCategoria={filtroCategoria}
            filtroComprador={filtroComprador}
            filtroStatusPromo={filtroStatusPromo}
            filtroStatus={filtroStatus}
            setFiltroProdutoDigitado={setFiltroProdutoDigitado}
            setFiltroMarca={setFiltroMarca}
            setFiltroCategoria={setFiltroCategoria}
            setFiltroComprador={setFiltroComprador}
            setFiltroStatusPromo={setFiltroStatusPromo}
            setFiltroStatus={setFiltroStatus}
            opcoesMarca={opcoesMarca}
            opcoesCategoria={opcoesCategoria}
            opcoesComprador={opcoesComprador}
            setPage={setPage}
            onClear={() => {
              setFiltroProduto("");
              setFiltroProdutoDigitado("");
              setFiltroMarca("");
              setFiltroCategoria("");
              setFiltroComprador("");
              setFiltroStatus("");
              setFiltroStatusPromo("");
              setPage(1);
            }}
          />

          <br />

          {!erro && itens.length === 0 && (
            <p className="text-sm text-slate-600">Nenhuma simulação encontrada.</p>
          )}

          {!erro && itens.length > 0 && (
            <>
              <HistoricoGrid
                itens={itens}
                excluindoId={excluindoId}
                onOpen={(item) => abrirModal(item)}
                onDelete={(id) => excluirItem(id)}
              />

              <HistoricoPagination
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                totalPages={totalPages}
                itensNaPagina={itens.length}
                onFirst={() => setPage(1)}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                onLast={() => setPage(totalPages)}
              />
            </>
          )}
        </main>
      )}

      {selecionado && (
        <HistoricoModal
          open={Boolean(selecionado)}
          item={selecionado}
          onClose={() => setSelecionado(null)}
          onUpdateItem={(novo) => setSelecionado(novo)}
          onReload={() => setReloadToken((t) => t + 1)}
        />

      )}

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
