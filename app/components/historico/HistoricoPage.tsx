"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Spinner } from "../Spinner";
import { AppHeader } from "../AppHeader";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { useHistorico } from "@/app/hooks/useHistorico";
import type { HistoricoFiltros, HistoricoItem } from "@/lib/types";
import { HistoricoPagination } from "../historico/HistoricoPagination";
import { HistoricoFilters } from "@/app/components/historico/HistoricoFilters";
import { HistoricoGrid } from "@/app/components/historico/HistoricoGrid";
import { HistoricoModal } from "@/app/components/historico/HistoricoModal";
import { ActionModal } from "@/app/components/ui/ActionModal";
import { ConfirmModal } from "@/app/components/ui/ConfirmModal";
import { logout } from "@/lib/api/auth";
import { deleteHistorico } from "@/lib/api/historico";


export default function HistoricoPage() {
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function getParam(name: string) {
    return (searchParams.get(name) ?? "").trim();
  }

  function getParamNumber(name: string, fallback: number) {
    const raw = (searchParams.get(name) ?? "").trim();
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  }

  function buildSearchFromState(state: {
    produto: string;
    marca: string;
    categoria: string;
    comprador: string;
    statusPromo: string;
    statusAnalise: string;
    page: number;
  }) {
    const p = new URLSearchParams();

    if (state.produto) p.set("produto", state.produto);
    if (state.marca) p.set("marca", state.marca);
    if (state.categoria) p.set("categoria", state.categoria);
    if (state.comprador) p.set("comprador", state.comprador);
    if (state.statusPromo) p.set("statusPromo", state.statusPromo);
    if (state.statusAnalise) p.set("statusAnalise", state.statusAnalise);

    p.set("page", String(state.page));

    return p.toString();
  }

  const initialProduto = getParam("produto");
  const initialMarca = getParam("marca");
  const initialCategoria = getParam("categoria");
  const initialComprador = getParam("comprador");
  const initialStatusPromo = getParam("statusPromo");
  const initialStatusAnalise = getParam("statusAnalise");
  const initialPage = getParamNumber("page", 1);

  const [selecionado, setSelecionado] = useState<HistoricoItem | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [filtroStatusPromo, setFiltroStatusPromo] = useState<string>(initialStatusPromo);

  const [filtroProduto, setFiltroProduto] = useState(initialProduto);
  const [filtroProdutoDigitado, setFiltroProdutoDigitado] = useState(initialProduto);

  const [filtroMarca, setFiltroMarca] = useState(initialMarca);
  const [filtroCategoria, setFiltroCategoria] = useState(initialCategoria);
  const [filtroComprador, setFiltroComprador] = useState(initialComprador);

  const [filtroStatus, setFiltroStatus] = useState<string>(initialStatusAnalise);

  const [page, setPage] = useState(initialPage);


  const [opcoesMarca, setOpcoesMarca] = useState<string[]>([]);
  const [opcoesCategoria, setOpcoesCategoria] = useState<string[]>([]);
  const [opcoesComprador, setOpcoesComprador] = useState<string[]>([]);

  const debouncedProduto = useDebouncedValue(filtroProdutoDigitado.trim(), 1000)

  const pageSize = 10;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalTitle, setActionModalTitle] = useState("");
  const [actionModalMessage, setActionModalMessage] = useState("");
  const [actionModalVariant, setActionModalVariant] = useState<"success" | "error" | "info">("info");

  function openActionModal(opts: {
    title: string;
    message: string;
    variant?: "success" | "error" | "info";
  }) {
    setActionModalTitle(opts.title);
    setActionModalMessage(opts.message);
    setActionModalVariant(opts.variant || "info");
    setActionModalOpen(true);
  }

  function pedirConfirmacaoExcluir(id: number) {
    setConfirmId(id);
    setConfirmOpen(true);
  }

  useEffect(() => {
    const produto = getParam("produto");
    const marca = getParam("marca");
    const categoria = getParam("categoria");
    const comprador = getParam("comprador");
    const statusPromo = getParam("statusPromo");
    const statusAnalise = getParam("statusAnalise");
    const urlPage = getParamNumber("page", 1);

    setFiltroProdutoDigitado((prev) => (prev !== produto ? produto : prev));
    setFiltroProduto((prev) => (prev !== produto ? produto : prev));

    setFiltroMarca((prev) => (prev !== marca ? marca : prev));
    setFiltroCategoria((prev) => (prev !== categoria ? categoria : prev));
    setFiltroComprador((prev) => (prev !== comprador ? comprador : prev));

    setFiltroStatusPromo((prev) => (prev !== statusPromo ? statusPromo : prev));
    setFiltroStatus((prev) => (prev !== statusAnalise ? statusAnalise : prev));

    setPage((prev) => (prev !== urlPage ? urlPage : prev));
  }, [searchParams]);

  useEffect(() => {
    const next = buildSearchFromState({
      produto: (filtroProduto || "").trim(),
      marca: (filtroMarca || "").trim(),
      categoria: (filtroCategoria || "").trim(),
      comprador: (filtroComprador || "").trim(),
      statusPromo: (filtroStatusPromo || "").trim(),
      statusAnalise: (filtroStatus || "").trim(),
      page,
    });

    const current = searchParams.toString();

    if (next !== current) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [
    filtroProduto,
    filtroMarca,
    filtroCategoria,
    filtroComprador,
    filtroStatusPromo,
    filtroStatus,
    page,
    pathname,
  ]);

  useEffect(() => {
    if (debouncedProduto === filtroProduto) return;
    setPage(1);
    setFiltroProduto(debouncedProduto);
  }, [debouncedProduto, filtroProduto]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const params = new URLSearchParams();
        if (filtroProduto) params.set("produto", filtroProduto);
        if (filtroStatusPromo) params.set("statusPromo", filtroStatusPromo);
        if (filtroStatus) params.set("statusAnalise", filtroStatus);

        if (filtroMarca) params.set("marca", filtroMarca);
        if (filtroCategoria) params.set("categoria", filtroCategoria);
        if (filtroComprador) params.set("comprador", filtroComprador);

        const res = await fetch(`/api/historico/options?${params.toString()}`);
        const data = await res.json().catch(() => null);

        if (!alive) return;
        if (!res.ok) return;

        setOpcoesMarca(Array.isArray(data?.marcas) ? data.marcas : []);
        setOpcoesCategoria(Array.isArray(data?.categorias) ? data.categorias : []);
        setOpcoesComprador(Array.isArray(data?.compradores) ? data.compradores : []);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    filtroProduto,
    filtroStatusPromo,
    filtroStatus,
    filtroMarca,
    filtroCategoria,
    filtroComprador,
  ]);

  useEffect(() => {
    if (filtroMarca && opcoesMarca.length && !opcoesMarca.includes(filtroMarca)) setFiltroMarca("");
  }, [opcoesMarca]);

  useEffect(() => {
    if (filtroCategoria && opcoesCategoria.length && !opcoesCategoria.includes(filtroCategoria)) setFiltroCategoria("");
  }, [opcoesCategoria]);

  useEffect(() => {
    if (filtroComprador && opcoesComprador.length && !opcoesComprador.includes(filtroComprador)) setFiltroComprador("");
  }, [opcoesComprador]);

  const filtros: HistoricoFiltros = {
    produto: filtroProduto || "",
    marca: filtroMarca || "",
    categoria: filtroCategoria || "",
    comprador: filtroComprador || "",
    statusPromo: (filtroStatusPromo || "") as any,
    statusAnalise: (filtroStatus || "") as any,
  };

  const { itens, totalCount, loading, erro } = useHistorico({
    ...filtros,
    page,
    pageSize,
    reloadToken,
  });


  async function excluirItem(id: number) {
    try {
      setExcluindoId(id);
      await deleteHistorico(id);

      if (page > 1 && itens.length === 1) {
        setPage((p) => Math.max(1, p - 1));
      }

      setReloadToken((t) => t + 1);
    } catch (err: any) {
      openActionModal({
        title: "Erro ao excluir",
        message: err?.message || "Erro ao excluir simulação.",
        variant: "error",
      });
    } finally {
      setExcluindoId(null);
    }
  }


  async function handleLogout() {
    try {
      setLogoutLoading(true);
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setLogoutLoading(false);
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
              onClick={() => setConfirmLogoutOpen(true)}
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
                onDelete={(id) => pedirConfirmacaoExcluir(id)}
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

      <ActionModal
        open={actionModalOpen}
        title={actionModalTitle}
        message={actionModalMessage}
        variant={actionModalVariant}
        onClose={() => setActionModalOpen(false)}
        autoCloseMs={actionModalVariant === "success" ? 3000 : undefined}
      />
      <ConfirmModal
        open={confirmOpen}
        title="Excluir simulação?"
        message="Tem certeza que deseja apagar este card? Esta ação não pode ser desfeita."
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        danger
        loading={confirmId !== null && excluindoId === confirmId}
        onClose={() => {
          if (excluindoId) return;
          setConfirmOpen(false);
          setConfirmId(null);
        }}
        onConfirm={async () => {
          if (confirmId === null) return;
          await excluirItem(confirmId);
          setConfirmOpen(false);
          setConfirmId(null);
        }}
      />
      <ConfirmModal
        open={confirmLogoutOpen}
        title="Sair do sistema?"
        message="Tem certeza que deseja encerrar sua sessão agora?"
        confirmLabel="Sim, sair"
        cancelLabel="Cancelar"
        danger={false}
        loading={logoutLoading}
        onClose={() => {
          if (logoutLoading) return;
          setConfirmLogoutOpen(false);
        }}
        onConfirm={async () => {
          await handleLogout();
          setConfirmLogoutOpen(false);
        }}
      />
    </div>
  );
}
