"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import type { ImportRow, Resultado, ResultadoLote } from "@/lib/types";
import { parseISODateLocal } from "@/lib/date";
import { parseNumberFromXlsx, toNumberBR } from "@/lib/format";
import { postCalculo } from "@/lib/api/calculo";

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
      "Marca",
      "TipoPromocao",
      "PeriodoHistorico",
      "LucroTotalHistorico",
      "DataInicioPromocao",
      "DataFimPromocao",
      "DataBaseHistorico",
      "PrecoPromocional",
      "CustoUnitario",
      "ReceitaAdicional",
    ];


    const exemplo = [
      "CREME DENTAL COLGATE 120G",
      "HIGIENE ORAL",
      "COLGATE",
      "INTERNA",
      30,
      12450,
      "10/01/2026",
      "20/01/2026",
      "07/2022 ou vazio",
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

  function parseMonthStart(v: any): string {
    if (v == null || v === "") return "";

    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}-01`;
    }

    if (typeof v === "number") {
      const dc = (XLSX as any)?.SSF?.parse_date_code?.(v);
      if (dc?.y && dc?.m) {
        const y = dc.y;
        const m = String(dc.m).padStart(2, "0");
        return `${y}-${m}-01`;
      }
      return "";
    }

    const s0 = String(v).trim();
    if (!s0) return "";

    let m: RegExpMatchArray | null = s0.match(/^(\d{4})-(\d{1,2})$/);
    if (m) {
      const yyyy = m[1];
      const mm = String(Number(m[2])).padStart(2, "0");
      if (Number(mm) >= 1 && Number(mm) <= 12) return `${yyyy}-${mm}-01`;
      return "";
    }

    m = s0.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const yyyy = m[1];
      const mm = m[2];
      if (Number(mm) >= 1 && Number(mm) <= 12) return `${yyyy}-${mm}-01`;
      return "";
    }

    m = s0.match(/^(\d{1,2})\/(\d{4})$/);
    if (m) {
      const mm = String(Number(m[1])).padStart(2, "0");
      const yyyy = m[2];
      if (Number(mm) >= 1 && Number(mm) <= 12) return `${yyyy}-${mm}-01`;
      return "";
    }

    m = s0.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const mm = m[2];
      const yyyy = m[3];
      if (Number(mm) >= 1 && Number(mm) <= 12) return `${yyyy}-${mm}-01`;
      return "";
    }

    return "";
  }



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

      const json: ImportRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

      if (!json.length) {
        setError("A planilha está vazia ou a primeira aba não contém dados para importar.");
        return;
      }

      const resultadosTemp: ResultadoLote[] = [];

      for (let i = 0; i < json.length; i++) {
        const linha = i + 2;
        const row: any = json[i];

        const produto = String(row.Produto || "").trim();
        const categoria = String(row.Categoria || "").trim();
        const marca = String(row.Marca || "").trim();

        const tipoRaw = String(row.TipoPromocao || "").trim().toUpperCase();
        const tipoPromocao =
          tipoRaw === "SCANNTECH" || tipoRaw === "INTERNA" ? tipoRaw : "INTERNA";

        if (!produto) {
          resultadosTemp.push({ linha, produto: "", ok: false, erro: "Produto em branco." });
          continue;
        }

        const A = parseNumberFromXlsx(row.PeriodoHistorico);
        const B = parseNumberFromXlsx(row.LucroTotalHistorico);
        const D = parseNumberFromXlsx(row.PrecoPromocional);
        const E = parseNumberFromXlsx(row.CustoUnitario);
        const F = parseNumberFromXlsx(row.ReceitaAdicional);


        const dataInicio = parseDateFromCell(row.DataInicioPromocao);
        const dataFim = parseDateFromCell(row.DataFimPromocao);
        const dataBaseHistorico = parseMonthStart(row.DataBaseHistorico);

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

        if (A === null || B === null || D === null || E === null || F === null) {
          resultadosTemp.push({
            linha,
            produto,
            ok: false,
            erro: "Valores numéricos inválidos (Periodo/Lucro/Preço/Custo/Receita). Verifique se não estão como texto.",
          });
          continue;
        }


        const diasPromo = diffMs / (1000 * 60 * 60 * 24) + 1;
        const C = String(diasPromo);

        try {
          const payload = await postCalculo({
            produto,
            categoria,
            marca,
            tipoPromocao,
            dataInicio,
            dataFim,
            ...(dataBaseHistorico ? { dataBaseHistorico } : {}),
            A: A ?? 0,
            B: B ?? 0,
            C: Number(C),
            D: D ?? 0,
            E: E ?? 0,
            F: F ?? 0,
          });


          resultadosTemp.push({ linha, produto, ok: true, resultado: payload as Resultado });
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
