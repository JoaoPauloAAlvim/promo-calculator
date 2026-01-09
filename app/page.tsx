"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "./components/Spinner";
import { AppHeader } from "./components/AppHeader";
import { logout } from "@/lib/api/auth";
import { parseISODateLocal } from "@/lib/date";
import { parseBR } from "@/lib/format";
import { ConfirmModal } from "@/app/components/ui/ConfirmModal";
import { PromoForm } from "@/app/components/home/PromoForm";
import { ResultModal } from "@/app/components/home/ResultModal";
import { ImportModal } from "@/app/components/home/ImportModal";
import { ErrorModal } from "@/app/components/home/ErrorModal";
import { FormState, Resultado } from "@/lib/types";
import { postCalculo } from "@/lib/api/calculo";
import { HomeHeaderActions } from "./components/home/HomeHeaderActions";
import { api } from "@/lib/api/client";
import { ActionModal } from "./components/ui/ActionModal";
import { usePromoImport } from "./hooks/usePromoImport";
import { getCompradores } from "@/lib/api/meta";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { getProdutoSugestao } from "@/lib/api/meta";


const initialForm: FormState = {
  produto: "",
  categoria: "",
  comprador: "",
  marca: "",
  tipoPromocao: "",
  dataInicio: "",
  dataFim: "",
  A: "",
  B: "",
  D: "",
  E: "",
  F: "",
};

export default function Home() {
  const router = useRouter();
  const promoImport = usePromoImport();
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [opcoesComprador, setOpcoesComprador] = useState<string[]>([]);
  const [modoComprador, setModoComprador] = useState<"LISTA" | "OUTRO">("LISTA");
  const [compradorOutro, setCompradorOutro] = useState("");
  const [marcaTouched, setMarcaTouched] = useState(false);
  const [categoriaTouched, setCategoriaTouched] = useState(false);
  const [lastSugestao, setLastSugestao] = useState<{ marca: string; categoria: string } | null>(null);
  const debouncedProdutoForm = useDebouncedValue((form.produto || "").trim(), 600);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintText, setHintText] = useState("");


  const campos: { id: keyof FormState; label: string; placeholder?: string }[] = [
    { id: "A", label: "Período histórico (dias)", placeholder: "Ex: 30" },
    {
      id: "B",
      label: "Lucro total histórico (R$)",
      placeholder: "Ex: 12.450,00",
    },
    {
      id: "D",
      label: "Preço promocional (R$)",
      placeholder: "Ex: 4,79",
    },
    { id: "E", label: "Custo unitário (R$)", placeholder: "Ex: 4,45" },
    {
      id: "F",
      label: "Receita adicional (R$)",
      placeholder: "Ex: 0,42",
    },

  ];


  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("simulador_draft");
      if (!raw) return;

      const draft = JSON.parse(raw);

      setForm((prev) => ({
        ...prev,
        produto: draft.produto ?? prev.produto,
        categoria: draft.categoria ?? prev.categoria,
        comprador: draft.comprador ?? prev.comprador,
        marca: draft.marca ?? prev.marca,
        tipoPromocao: draft.tipoPromocao ?? prev.tipoPromocao,
        dataInicio: draft.dataInicio ?? prev.dataInicio,
        dataFim: draft.dataFim ?? prev.dataFim,
        A: draft.A ?? prev.A,
        B: draft.B ?? prev.B,
        D: draft.D ?? prev.D,
        E: draft.E ?? prev.E,
        F: draft.F ?? prev.F,
      }));
      setModoComprador("LISTA");
      setCompradorOutro("");


      sessionStorage.removeItem("simulador_draft");
      setDraftModalOpen(true)
    } catch {
      try { sessionStorage.removeItem("simulador_draft"); } catch { }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        await ensureAuth();
        const data = await getCompradores(controller.signal);
        setOpcoesComprador(Array.isArray(data?.compradores) ? data.compradores : []);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => controller.abort();
  }, []);

  async function ensureAuth() {
    await api<{ ok: true }>("/api/auth/check", { method: "GET" });
  }

  function setField(id: keyof FormState, value: string) {
    if (id === "marca") setMarcaTouched(true);
    if (id === "categoria") setCategoriaTouched(true);

    if (id === "produto") {
      setMarcaTouched(false);
      setCategoriaTouched(false);
      setLastSugestao(null);
    }

    setForm((prev) => ({ ...prev, [id]: value }));
  }


  async function handleLogout() {
    try {
      setLogoutLoading(true);
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setLogoutLoading(false);
      try {
        localStorage.removeItem("simulador_had_session");
        sessionStorage.removeItem("simulador_expired_shown");
        sessionStorage.removeItem("simulador_session_expired");
      } catch { }
      router.replace("/login");
    }
  }


  async function calcular() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      await ensureAuth()
      const { produto, categoria, comprador, marca, dataInicio, dataFim, tipoPromocao } = form;

      if (!produto.trim()) {
        setResult(null);
        setError("Informe o nome do produto.");
        return;
      }

      if (!tipoPromocao) {
        setResult(null)
        setError("Informe o tipo da promoção.")
        return;
      }

      if (!dataInicio || !dataFim) {
        setResult(null);
        setError("Informe a data de início e a data de fim da promoção.");
        return;
      }

      const inicioDia = parseISODateLocal(dataInicio);
      const fimDia = parseISODateLocal(dataFim);

      if (!inicioDia || !fimDia) {
        setResult(null);
        setError("Data de início ou fim inválida.");
        return;
      }


      const diffMs = fimDia.getTime() - inicioDia.getTime();
      if (diffMs < 0) {
        setResult(null);
        setError(
          "A data de fim da promoção deve ser maior ou igual à data de início."
        );
        return;
      }

      const diasPromo = diffMs / (1000 * 60 * 60 * 24) + 1;
      const C = diasPromo;

      const A = parseBR(form.A);
      const B = parseBR(form.B);
      const D = parseBR(form.D);
      const E = parseBR(form.E);
      const F = parseBR(form.F);

      const valoresNumericos = [form.A, form.B, form.D, form.E, form.F];
      const algumVazio = valoresNumericos.some((v) => v.trim() === "");
      if (algumVazio) {
        setResult(null);
        setError("Preencha todos os campos numéricos antes de calcular.");
        return;
      }

      if ([A, B, D, E, F].some((v) => Number.isNaN(v))) {
        setResult(null);
        setError(
          "Todos os campos numéricos devem ser válidos. Use vírgula como separador decimal (ex: 4,79)."
        );
        return;
      }

      if (A <= 0) {
        setResult(null);
        setError("O período histórico (dias) deve ser maior que zero.");
        return;
      }

      if (C <= 0) {
        setResult(null);
        setError("A duração da promoção (dias) deve ser maior que zero.");
        return;
      }

      const data = await postCalculo({
        produto,
        categoria,
        comprador,
        marca,
        tipoPromocao,
        dataInicio,
        dataFim,
        A,
        B,
        C,
        D,
        E,
        F,
      });

      setResult(data as Resultado);
    } catch (e) {
      console.error(e);
      setResult(null);
      setError("Ocorreu um erro inesperado ao calcular. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function fecharModalResultado() {
    setResult(null);
    setError(null);
    setForm(initialForm);
  }

  function fecharModalErro() {
    setError(null);
  }

  async function abrirImportComAuth() {
    await ensureAuth();
    promoImport.abrir();
  }
  useEffect(() => {
    const produto = debouncedProdutoForm;

    if (!produto || produto.length < 3) return;

    const controller = new AbortController();

    (async () => {
      try {
        const data = await getProdutoSugestao(produto, controller.signal);

        const s = data?.sugestao;
        if (!s) return;

        setForm((prev) => {
          const marcaAtual = (prev.marca || "").trim();
          const catAtual = (prev.categoria || "").trim();

          const podeSetMarca =
            !marcaTouched || !marcaAtual || (lastSugestao && marcaAtual === lastSugestao.marca);

          const podeSetCategoria =
            !categoriaTouched || !catAtual || (lastSugestao && catAtual === lastSugestao.categoria);

          const next = { ...prev };

          if (podeSetMarca && s.marca) next.marca = s.marca;
          if (podeSetCategoria && s.categoria) next.categoria = s.categoria;

          return next;
        });

        setLastSugestao({ marca: s.marca || "", categoria: s.categoria || "" });
        setHintText("Sugestão do histórico aplicada (marca/categoria).");
        setHintOpen(true);

        setTimeout(() => setHintOpen(false), 2000);

      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
      }
    })();

    return () => controller.abort();
  }, [debouncedProdutoForm]);



  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader
        title="Simulador de Promoções"
        rightSlot={
          <HomeHeaderActions
            onOpenImport={abrirImportComAuth}
            onLogout={() => setConfirmLogoutOpen(true)}
          />
        }
      />
      <PromoForm
        form={form}
        campos={campos}
        loading={loading}
        onChange={setField}
        onCalculate={calcular}
        opcoesComprador={opcoesComprador}
        modoComprador={modoComprador}
        setModoComprador={setModoComprador}
        compradorOutro={compradorOutro}
        setCompradorOutro={setCompradorOutro}
        hintOpen={hintOpen}
        setHintOpen={setHintOpen}
        hintText={hintText}
        setHintText={setHintText}
      />


      {result && (
        <ResultModal
          result={result as any}
          form={form as any}
          onClose={fecharModalResultado}
        />
      )}

      <ErrorModal
        open={Boolean(error && !result)}
        message={error || ""}
        onClose={fecharModalErro}
      />

      <ImportModal
        open={promoImport.open}
        onClose={promoImport.fechar}
        onGenerateModel={promoImport.gerarModelo}
        onFileChange={promoImport.onFileChange}
        importFileName={promoImport.fileName}
        importLoading={promoImport.loading}
        importError={promoImport.error}
        importResults={promoImport.results}
      />


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
            Calculando simulação…
          </p>
        </div>
      )}
      <ActionModal
        open={draftModalOpen}
        title="Simulação carregada"
        message="Os dados foram preenchidos com base no histórico. Ajuste o que precisar e clique em Calcular."
        variant="success"
        onClose={() => setDraftModalOpen(false)}
        autoCloseMs={3000}
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
