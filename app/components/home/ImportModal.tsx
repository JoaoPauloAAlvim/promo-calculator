"use client";

import React from "react";
import { Spinner } from "../Spinner";
import type { ResultadoLote } from "@/lib/types";
import { formatBR } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;

  onGenerateModel: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  importFileName: string | null;
  importLoading: boolean;
  importError: string | null;
  importResults: ResultadoLote[];
};

export function ImportModal({
  open,
  onClose,
  onGenerateModel,
  onFileChange,
  importFileName,
  importLoading,
  importError,
  importResults,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-[720px] max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
          type="button"
        >
          ✕
        </button>

        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Importar planilha Excel
        </h3>

        <p className="text-xs text-slate-600 mb-3">
          Formato esperado: primeira aba com colunas{" "}
          <strong>
            Produto, Categoria, Comprador, Marca, PeriodoHistorico,
            LucroTotalHistorico, DataInicioPromocao, DataFimPromocao,
            PrecoPromocional, CustoUnitario, ReceitaAdicional
          </strong>
          . Use datas como <code>AAAA-MM-DD</code> ou <code>DD/MM/AAAA</code>.
        </p>

        {/* Linha: escolher arquivo + baixar modelo */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* ✅ Apenas UM input file */}
            <input
              id="file-input-excel"
              type="file"
              accept=".xlsx,.xls"
              onChange={onFileChange}
              className="hidden"
            />

            <label
              htmlFor="file-input-excel"
              className="inline-flex items-center justify-center rounded-[10px] bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow cursor-pointer whitespace-nowrap"
            >
              Escolher arquivo
            </label>

            {importFileName && (
              <span className="text-xs text-slate-600 truncate max-w-[260px]">
                {importFileName}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onGenerateModel}
            className="inline-flex items-center justify-center rounded-[10px] bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow whitespace-nowrap"
          >
            Baixar modelo (.xlsx)
          </button>
        </div>

        {/* Erro */}
        {importError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            ⚠ {importError}
          </div>
        )}

        {/* Resultados */}
        {importResults.length > 0 && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Resultados da simulação em lote
            </p>
            <p className="text-xs text-slate-600 mb-2">
              Linhas OK foram salvas no histórico normalmente via API de cálculo.
            </p>

            {/* ✅ Scroll horizontal para não quebrar no mobile */}
            <div className="max-h-[260px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[900px] w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border px-2 py-1 text-left">Linha</th>
                    <th className="border px-2 py-1 text-left">Produto</th>
                    <th className="border px-2 py-1 text-left">Status</th>
                    <th className="border px-2 py-1 text-left">Lucro diário hist.</th>
                    <th className="border px-2 py-1 text-left">Lucro unit. promo</th>
                    <th className="border px-2 py-1 text-left">Meta unid/dia</th>
                    <th className="border px-2 py-1 text-left">Meta unid/período</th>
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
                        <td className="border px-2 py-1">{r.produto || "—"}</td>
                        <td className="border px-2 py-1">
                          {r.ok ? (
                            <span className="text-emerald-700 font-semibold">OK</span>
                          ) : (
                            <span className="text-red-700 font-semibold">FALHA</span>
                          )}
                        </td>
                        <td className="border px-2 py-1">
                          {r.ok ? `R$ ${formatBR(Number((entrada as any).lucro_diario_hist))}` : "—"}
                        </td>
                        <td className="border px-2 py-1">
                          {r.ok && metas?.lucro_unitario_promo !== undefined
                            ? `R$ ${formatBR(Number(metas.lucro_unitario_promo))}`
                            : "—"}
                        </td>
                        <td className="border px-2 py-1">
                          {r.ok && metas?.meta_unid_dia !== undefined ? metas.meta_unid_dia : "—"}
                        </td>
                        <td className="border px-2 py-1">
                          {r.ok && metas?.meta_unid_total !== undefined ? metas.meta_unid_total : "—"}
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
          <div className="absolute inset-0 rounded-2xl bg-white/70 flex flex-col items-center justify-center">
            <Spinner size={32} />
            <p className="mt-2 text-xs font-medium text-slate-700">
              Processando planilha…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
