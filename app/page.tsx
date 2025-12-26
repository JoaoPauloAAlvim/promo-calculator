"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { entradaLabels } from "@/lib/entradaLabels";
import { Spinner } from "./components/Spinner";
import { AppHeader } from "./components/AppHeader";

type FormState = {
  produto: string;
  categoria: string;
  comprador: string;
  marca: string;
  dataInicio: string;
  dataFim: string;
  A: string;
  B: string;
  D: string;
  E: string;
  F: string;
};


type Resultado = {
  entrada: Record<string, any>;
  metas: Record<string, any>;
};

type ImportRow = {
  Produto?: string;
  Categoria?: string;
  Comprador?: string;
  Marca?: string;
  PeriodoHistorico?: number | string;
  LucroTotalHistorico?: number | string;
  DataInicioPromocao?: string | number;
  DataFimPromocao?: string | number;
  PrecoPromocional?: number | string;
  CustoUnitario?: number | string;
  ReceitaAdicional?: number | string;
};


type ResultadoLote = {
  linha: number;
  produto: string;
  ok: boolean;
  erro?: string;
  resultado?: Resultado;
};

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


const formatBR = (valor: number | undefined): string => {
  if (valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function parseDateFromCell(v: unknown): string | null {
  if (!v) return null;

  if (typeof v === "string") {
    const s = v.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split("/");
      return `${y}-${m}-${d}`; // ISO
    }
  }

  return null;
}

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false); // loading da simulação única
  const [error, setError] = useState<string | null>(null);

  // estado do modal de importação
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

  const entrada = result?.entrada ?? {};
  const metas = result?.metas ?? {};

  const nomeProduto =
    (result as any)?.entrada?.produto_nome ??
    (result as any)?.entrada?.produto ??
    form.produto;

  const parseBR = (valor: string): number => {
    if (!valor) return NaN;
    const limpo = valor.trim().replace(/\./g, "").replace(",", ".");
    return Number(limpo);
  };

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      router.push("/login");
    }
  }

  async function calcular() {
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

      const inicioDate = new Date(dataInicio);
      const fimDate = new Date(dataFim);


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

      const diffMs = fimDia.getTime() - inicioDia.getTime();
      if (diffMs < 0) {
        setResult(null);
        setError(
          "A data de fim da promoção deve ser maior ou igual à data de início."
        );
        return;
      }

      const diasPromo = diffMs / (1000 * 60 * 60 * 24) + 1; // dias inclusivos
      const C = diasPromo; // vamos mandar C como número de dias calculados

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

      const response = await fetch("/api/calculo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      // ... resto da função (parse do response, setResult, setError) continua igual


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
        setResult(null);
        setError(msg);
        return;
      }

      if (data && (data.error || data.erro)) {
        setResult(null);
        setError(data.error || data.erro);
        return;
      }

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

  function abrirModalImportacao() {
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

  function gerarPlanilhaModelo() {
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
      "10/01/2025", // DataInicioPromocao
      "20/01/2025", // DataFimPromocao
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

      const toNumericString = (v: any): string => {
        if (typeof v === "number") return String(v);
        if (typeof v === "string") return v;
        return "";
      };

      // converte célula de data (texto BR, ISO ou data Excel) para AAAA-MM-DD
      const parseDateFromCell = (v: any): string | null => {
        if (!v && v !== 0) return null;

        // 1) Texto
        if (typeof v === "string") {
          const s = v.trim();

          // AAAA-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

          // DD/MM/AAAA
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
            const [d, m, y] = s.split("/");
            return `${y}-${m}-${d}`;
          }

          // outros formatos de texto: considera inválido
          return null;
        }

        // 2) Número: data nativa do Excel
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
        const linha = i + 2; // +2 por causa do cabeçalho
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

        // Datas da promoção (podem vir como texto BR, ISO ou data Excel)
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

        // calcula C = dias da promoção (início e fim inclusivos)
        const inicioDate = new Date(dataInicio);
        const fimDate = new Date(dataFim);

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
          const res = await fetch("/api/calculo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              produto,
              categoria,
              comprador,
              marca,
              dataInicio,
              dataFim,
              A,
              B,
              C, // calculado pelas datas
              D,
              E,
              F,
            }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok || data?.error || data?.erro) {
            resultadosTemp.push({
              linha,
              produto,
              ok: false,
              erro:
                data?.error ||
                data?.erro ||
                "Erro ao calcular para esta linha.",
            });
            continue;
          }

          resultadosTemp.push({
            linha,
            produto,
            ok: true,
            resultado: data as Resultado,
          });
        } catch (err: any) {
          console.error(err);
          resultadosTemp.push({
            linha,
            produto,
            ok: false,
            erro: "Falha inesperada ao chamar a API.",
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/historico" style={{ textDecoration: "none" }}>
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
                Histórico
              </span>
            </Link>

            <button
              type="button"
              onClick={abrirModalImportacao}
              style={{
                padding: "6px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              }}
            >
              Importar planilha
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "6px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                backgroundColor: "#ff0303ff",
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
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

            {/* Categoria */}
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
                Categoria do produto
              </label>
              <input
                type="text"
                placeholder="Ex: HIGIENE ORAL"
                value={form.categoria}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoria: e.target.value }))
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

            {/* Comprador */}
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
                Comprador
              </label>
              <input
                type="text"
                placeholder="Ex: FLÁVIA / JÉSSICA"
                value={form.comprador}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comprador: e.target.value }))
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

            {/* Marca */}
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
                Marca
              </label>
              <input
                type="text"
                placeholder="Ex: COLGATE"
                value={form.marca}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, marca: e.target.value }))
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
            {/* Data de início da promoção */}
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
                Data de início da promoção
              </label>
              <input
                type="date"
                value={form.dataInicio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dataInicio: e.target.value }))
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

            {/* Data de fim da promoção */}
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
                Data de fim da promoção
              </label>
              <input
                type="date"
                value={form.dataFim}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dataFim: e.target.value }))
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


            {/* Campos numéricos A–F */}
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
            <button
              onClick={fecharModalResultado}
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

            {/* Lucro diário + lucro unitário */}
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
                  {`R$ ${formatBR(Number(entrada?.lucro_diario_hist))}`}
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
                  {metas?.lucro_unitario_promo !== undefined
                    ? `R$ ${formatBR(Number(metas.lucro_unitario_promo))}`
                    : "—"}
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
                  {metas?.meta_unid_dia ?? "—"}{" "}
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
                  {metas?.meta_unid_total ?? "—"}{" "}
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
                    {nomeProduto || "Produto não informado"}
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
                    {entrada.categoria || "—"}
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
                    {entrada.comprador || "—"}
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
                    {entrada.marca || "—"}
                  </p>
                </div>

                {/* Campos A–F */}
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

      {/* MODAL DE ERRO */}
      {error && !result && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
            zIndex: 60,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              maxWidth: "420px",
              width: "100%",
              padding: "18px 20px 16px",
              border: "1px solid #fecaca",
              boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
              position: "relative",
            }}
          >
            <button
              onClick={fecharModalErro}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                borderRadius: "999px",
                border: "none",
                padding: "3px 7px",
                fontSize: "11px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  backgroundColor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  color: "#b91c1c",
                  flexShrink: 0,
                }}
              >
                !
              </div>
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#991b1b",
                    marginBottom: "4px",
                  }}
                >
                  Não foi possível concluir a simulação
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#4b5563",
                    marginBottom: "10px",
                  }}
                >
                  {error}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={fecharModalErro}
                    style={{
                      fontSize: "12px",
                      borderRadius: "999px",
                      border: "none",
                      padding: "6px 14px",
                      backgroundColor: "#b91c1c",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    OK, entendi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO */}
      {showImportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
            zIndex: 80,
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
              onClick={fecharModalImportacao}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
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

            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "6px",
              }}
            >
              Importar planilha Excel
            </h3>

            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              Formato esperado: primeira aba com colunas{" "}
              <strong>
                Produto, Categoria, Comprador, Marca, PeriodoHistorico,
                LucroTotalHistorico, DataInicioPromocao, DataFimPromocao,
                PrecoPromocional, CustoUnitario, ReceitaAdicional
              </strong>
              . Use datas como <code>AAAA-MM-DD</code> ou <code>DD/MM/AAAA</code>.
            </p>


            {/* Linha com Escolher arquivo (esquerda) e Baixar modelo (direita) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              {/* Lado esquerdo: botão Escolher arquivo + nome do arquivo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flex: "1 1 0",
                }}
              >
                <input
                  id="file-input-excel"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFileChange}
                  style={{ display: "none" }}
                />

                <label
                  htmlFor="file-input-excel"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#0f766e", // mesmo estilo de antes
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                    border: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Escolher arquivo
                </label>

                {importFileName && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "260px",
                    }}
                  >
                    {importFileName}
                  </span>
                )}
              </div>

              {/* Lado direito: botão Baixar modelo */}
              <div
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={gerarPlanilhaModelo}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#0f766e", // mesmo estilo de antes
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                    border: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Baixar modelo (.xlsx)
                </button>
              </div>
            </div>



            {/* Botão para escolher arquivo */}
            <div
              style={{
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                id="file-input-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFileChange}
                style={{ display: "none" }}
              />



              {importFileName && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "260px",
                  }}
                >
                  {importFileName}
                </span>
              )}
            </div>

            {importError && (
              <div
                style={{
                  marginTop: "4px",
                  marginBottom: "8px",
                  borderRadius: "10px",
                  border: "1px solid #fecaca",
                  backgroundColor: "#fee2e2",
                  padding: "8px 10px",
                  fontSize: "12px",
                  color: "#b91c1c",
                }}
              >
                ⚠ {importError}
              </div>
            )}

            {importResults.length > 0 && (
              <div
                style={{
                  marginTop: "10px",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "10px",
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
                  Resultados da simulação em lote
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  Linhas OK foram salvas no histórico normalmente via API de
                  cálculo.
                </p>

                <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                  <table className="min-w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border px-2 py-1 text-left">Linha</th>
                        <th className="border px-2 py-1 text-left">Produto</th>
                        <th className="border px-2 py-1 text-left">Status</th>
                        <th className="border px-2 py-1 text-left">
                          Lucro diário hist.
                        </th>
                        <th className="border px-2 py-1 text-left">
                          Lucro unit. promo
                        </th>
                        <th className="border px-2 py-1 text-left">
                          Meta unid/dia
                        </th>
                        <th className="border px-2 py-1 text-left">
                          Meta unid/período
                        </th>
                        <th className="border px-2 py-1 text-left">Erro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResults.map((r) => {
                        const entrada = r.resultado?.entrada ?? {};
                        const metas = r.resultado?.metas ?? {};

                        return (
                          <tr key={r.linha}>
                            <td className="border px-2 py-1">{r.linha}</td>
                            <td className="border px-2 py-1">
                              {r.produto || "—"}
                            </td>
                            <td className="border px-2 py-1">
                              {r.ok ? (
                                <span className="text-emerald-700 font-semibold">
                                  OK
                                </span>
                              ) : (
                                <span className="text-red-700 font-semibold">
                                  FALHA
                                </span>
                              )}
                            </td>
                            <td className="border px-2 py-1">
                              {r.ok
                                ? `R$ ${formatBR(
                                  Number(entrada.lucro_diario_hist)
                                )}`
                                : "—"}
                            </td>
                            <td className="border px-2 py-1">
                              {r.ok &&
                                metas?.lucro_unitario_promo !== undefined
                                ? `R$ ${formatBR(
                                  Number(metas.lucro_unitario_promo)
                                )}`
                                : "—"}
                            </td>
                            <td className="border px-2 py-1">
                              {r.ok && metas?.meta_unid_dia !== undefined
                                ? metas.meta_unid_dia
                                : "—"}
                            </td>
                            <td className="border px-2 py-1">
                              {r.ok && metas?.meta_unid_total !== undefined
                                ? metas.meta_unid_total
                                : "—"}
                            </td>
                            <td className="border px-2 py-1 text-red-600">
                              {!r.ok ? r.erro : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "16px",
                }}
              >
                <Spinner size={32} />
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#4b5563",
                  }}
                >
                  Processando planilha…
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY DE LOADING da simulação única */}
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
    </div>
  );
}
