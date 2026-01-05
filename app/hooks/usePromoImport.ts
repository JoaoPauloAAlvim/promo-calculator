"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import type { ImportRow, Resultado, ResultadoLote } from "@/lib/types";
import { parseISODateLocal } from "@/lib/date";
import { toNumericString } from "@/lib/format";
import { calcularPromocao } from "@/lib/api/calculo";

export function usePromoImport() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultadoLote[]>([]);

  function abrir() {
    setOpen(true);
    setFileName(null);
    setError(null);
    setResults([]);
  }

  function fechar() {
    setOpen(false);
    setFileName(null);
    setError(null);
    setResults([]);
  }

  function gerarModelo() {
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
      "10/01/2026",
      "20/01/2026",
      4.79,
      4.45,
      0.42,
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, exemplo]);
    XLSX.utils.book_append_sheet(wb, ws, "PROMOCOES");
    XLSX.writeFile(wb, "modelo_promocoes.xlsx");
  }

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
      const y = dateObj.y, m = dateObj.m, d = dateObj.d;
      if (!y || !m || !d) return null;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }

    return null;
  };



  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResults([]);
    setError(null);

    if (!file) {
      setFileName(null);
      return;
    }

    setFileName(file.name);
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json: ImportRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!json.length) {
        setError("A planilha está vazia ou a primeira aba não contém dados para importar.");
        return;
      }

      const resultadosTemp: ResultadoLote[] = [];

      for (let i = 0; i < json.length; i++) {
        const linha = i + 2;
        const row = json[i];

        const produto = String(row.Produto || "").trim();
        const categoria = String(row.Categoria || "").trim();
        const comprador = String(row.Comprador || "").trim();
        const marca = String(row.Marca || "").trim();

        if (!produto) {
          resultadosTemp.push({ linha, produto: "", ok: false, erro: "Produto em branco." });
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
            erro: "DataInicioPromocao ou DataFimPromocao inválida(s). Use DD/MM/AAAA ou AAAA-MM-DD.",
          });
          continue;
        }

        const inicioDia = parseISODateLocal(dataInicio);
        const fimDia = parseISODateLocal(dataFim);

        if (!inicioDia || !fimDia) {
          resultadosTemp.push({ linha, produto, ok: false, erro: "Datas inválidas na planilha." });
          continue;
        }

        const diffMs = fimDia.getTime() - inicioDia.getTime();
        if (diffMs < 0) {
          resultadosTemp.push({
            linha,
            produto,
            ok: false,
            erro: "DataFimPromocao deve ser maior ou igual à DataInicioPromocao na planilha.",
          });
          continue;
        }

        const diasPromo = diffMs / (1000 * 60 * 60 * 24) + 1;
        const C = String(diasPromo);

        try {
          const payload = await calcularPromocao({
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

          resultadosTemp.push({
            linha,
            produto,
            ok: true,
            resultado: payload as Resultado,
          });
        } catch (err: any) {
          console.error(err);

          resultadosTemp.push({
            linha,
            produto,
            ok: false,
            erro: err?.message || "Erro ao calcular para esta linha.",
          });
        }

      }

      setResults(resultadosTemp);
    } catch (err) {
      console.error(err);
      setError("Erro ao ler a planilha. Verifique se o arquivo é um .xlsx válido.");
    } finally {
      setLoading(false);
    }
  }

  return {
    open,
    fileName,
    loading,
    error,
    results,
    abrir,
    fechar,
    gerarModelo,
    onFileChange,
  };
}
