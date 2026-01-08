"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Spinner } from "./components/Spinner";
import { AppHeader } from "./components/AppHeader";
import { logout } from "@/lib/api/auth";
import { parseISODateLocal } from "@/lib/date";
import { parseBR, toNumericString } from "@/lib/format";
import { ConfirmModal } from "@/app/components/ui/ConfirmModal";
import { PromoForm } from "@/app/components/home/PromoForm";
import { ResultModal } from "@/app/components/home/ResultModal";
import { ImportModal } from "@/app/components/home/ImportModal";
import { ErrorModal } from "@/app/components/home/ErrorModal";
import { FormState, ImportRow, Resultado, ResultadoLote } from "@/lib/types";
import { postCalculo } from "@/lib/api/calculo";
import { HomeHeaderActions } from "./components/home/HomeHeaderActions";
import { api } from "@/lib/api/client";
import { ActionModal } from "./components/ui/ActionModal";

const initialForm: FormState = {
  produto: "",
  categoria: "",
  comprador: "",
  marca: "",
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
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<ResultadoLote[]>([]);

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
        dataInicio: draft.dataInicio ?? prev.dataInicio,
        dataFim: draft.dataFim ?? prev.dataFim,
        A: draft.A ?? prev.A,
        B: draft.B ?? prev.B,
        D: draft.D ?? prev.D,
        E: draft.E ?? prev.E,
        F: draft.F ?? prev.F,
      }));

      sessionStorage.removeItem("simulador_draft");
      setDraftModalOpen(true)
    } catch {
      try { sessionStorage.removeItem("simulador_draft"); } catch { }
    }
  }, []);


  async function ensureAuth() {
    await api<{ ok: true }>("/api/auth/check", { method: "GET" });
  }

  function setField(id: keyof FormState, value: string) {
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
    await ensureAuth()
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { produto, categoria, comprador, marca, dataInicio, dataFim } = form;

      if (!produto.trim()) {
        setResult(null);
        setError("Informe o nome do produto.");
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
        dataInicio,
        dataFim,
        A,
        B,
        C,
        D,
        E,
        F,
      });

      setResult(data);


      setResult(data as Resultado);

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

  async function abrirModalImportacao() {
    await ensureAuth()
    setShowImportModal(true);
    setImportFileName(null);
    setImportError(null);
    setImportResults([]);
  }

  function fecharModalImportacao() {
    setShowImportModal(false);
    setImportFileName(null);
    setImportError(null);
    setImportResults([]);
  }

  async function gerarPlanilhaModelo() {
    await ensureAuth()
    const header = [
      "Produto",
      "Categoria",
      "Comprador",
      "Marca",
      "PeriodoHistorico",
      "LucroTotalHistorico",
      "DataInicioPromocao",
      "DataFimPromocao",
      "PrecoPromocional",
      "CustoUnitario",
      "ReceitaAdicional",
    ];


    const exemplo = [
      "CREME DENTAL COLGATE 120G",
      "HIGIENE ORAL",
      "FLÁVIA",
      "COLGATE",
      30,
      12450,
      "10/01/2025",
      "20/01/2025",
      4.79,
      4.45,
      0.42,
    ];


    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, exemplo]);
    XLSX.utils.book_append_sheet(wb, ws, "PROMOCOES");
    XLSX.writeFile(wb, "modelo_promocoes.xlsx");
  }

  async function handleImportFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    setImportResults([]);
    setImportError(null);

    if (!file) {
      setImportFileName(null);
      return;
    }

    setImportFileName(file.name);
    setImportLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json: ImportRow[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      });

      if (!json.length) {
        setImportError(
          "A planilha está vazia ou a primeira aba não contém dados para importar."
        );
        return;
      }

      const resultadosTemp: ResultadoLote[] = [];



      const parseDateFromCell = (v: any): string | null => {
        if (!v && v !== 0) return null;

        if (typeof v === "string") {
          const s = v.trim();

          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

          if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
            const [d, m, y] = s.split("/");
            return `${y}-${m}-${d}`;
          }

          return null;
        }

        if (typeof v === "number") {
          const dateObj = (XLSX.SSF as any).parse_date_code?.(v);
          if (!dateObj) return null;
          const y = dateObj.y;
          const m = dateObj.m;
          const d = dateObj.d;

          if (!y || !m || !d) return null;

          const mm = String(m).padStart(2, "0");
          const dd = String(d).padStart(2, "0");
          return `${y}-${mm}-${dd}`;
        }

        return null;
      };

      for (let i = 0; i < json.length; i++) {
        const linha = i + 2;
        const row = json[i];

        const produto = String(row.Produto || "").trim();
        const categoria = String(row.Categoria || "").trim();
        const comprador = String(row.Comprador || "").trim();
        const marca = String(row.Marca || "").trim();

        if (!produto) {
          resultadosTemp.push({
            linha,
            produto: "",
            ok: false,
            erro: "Produto em branco.",
          });
          continue;
        }

        const A = toNumericString(row.PeriodoHistorico);
        const B = toNumericString(row.LucroTotalHistorico);
        const D = toNumericString(row.PrecoPromocional);
        const E = toNumericString(row.CustoUnitario);
        const F = toNumericString(row.ReceitaAdicional);

        const dataInicio = parseDateFromCell(row.DataInicioPromocao);
        const dataFim = parseDateFromCell(row.DataFimPromocao);

        if (!dataInicio || !dataFim) {
          resultadosTemp.push({
            linha,
            produto,
            ok: false,
            erro:
              "DataInicioPromocao ou DataFimPromocao inválida(s). Use data ou texto no formato DD/MM/AAAA ou AAAA-MM-DD.",
          });
          continue;
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
          resultadosTemp.push({
            linha,
            produto,
            ok: false,
            erro:
              "DataFimPromocao deve ser maior ou igual à DataInicioPromocao na planilha.",
          });
          continue;
        }

        const diasPromo = diffMs / (1000 * 60 * 60 * 24) + 1;
        const C = String(diasPromo);

        try {
          const data = await postCalculo({
            produto,
            categoria,
            comprador,
            marca,
            dataInicio,
            dataFim,
            A: Number(A),
            B: Number(B),
            C: Number(C),
            D: Number(D),
            E: Number(E),
            F: Number(F),
          });

          resultadosTemp.push({ linha, produto, ok: true, resultado: data as Resultado });
        } catch (err: any) {
          resultadosTemp.push({
            linha,
            produto,
            ok: false,
            erro: err?.message || "Erro ao calcular para esta linha.",
          });
        }

      }

      setImportResults(resultadosTemp);
    } catch (err: any) {
      console.error(err);
      setImportError(
        "Erro ao ler a planilha. Verifique se o arquivo é um .xlsx válido."
      );
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader
        title="Simulador de Promoções"
        rightSlot={
          <HomeHeaderActions
            onOpenImport={abrirModalImportacao}
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
        open={showImportModal}
        onClose={fecharModalImportacao}
        onGenerateModel={gerarPlanilhaModelo}
        onFileChange={handleImportFileChange}
        importFileName={importFileName}
        importLoading={importLoading}
        importError={importError}
        importResults={importResults as any}
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
