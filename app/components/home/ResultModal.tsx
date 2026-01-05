"use client";

import type { Resultado, FormState } from "@/lib/types";
import { entradaLabels } from "@/lib/entradaLabels";
import { formatBR } from "@/lib/format";

type Props = {
  result: Resultado;
  form?: FormState;
  onClose: () => void;
};

export function ResultModal({ result, form, onClose }: Props) {
  const entrada = result?.entrada ?? {};
  const metas = result?.metas ?? {};

  const nomeProduto =
    (result as any)?.entrada?.produto_nome ??
    (result as any)?.entrada?.produto ??
    form?.produto ?? 
    "";


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-[10px] bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
        >
          ✕
        </button>

        <div className="mb-3">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-slate-500 mb-1">
            Resultado da simulação
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {nomeProduto || "Produto não informado"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Lucro diário histórico</p>
            <p className="text-base font-bold text-slate-900">
              {`R$ ${formatBR(Number((entrada as any)?.lucro_diario_hist))}`}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Lucro unitário na promoção</p>
            <p className="text-base font-bold text-slate-900">
              {metas?.lucro_unitario_promo !== undefined
                ? `R$ ${formatBR(Number(metas.lucro_unitario_promo))}`
                : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Meta de unidades por dia</p>
            <p className="text-base font-bold text-slate-900">
              {metas?.meta_unid_dia ?? "—"}{" "}
              <span className="text-xs font-normal text-slate-500">unid/dia</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Meta de unidades no período</p>
            <p className="text-base font-bold text-slate-900">
              {metas?.meta_unid_total ?? "—"}{" "}
              <span className="text-xs font-normal text-slate-500">unid</span>
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-sm font-semibold text-slate-900 mb-2">Dados informados na simulação</p>

          <div className="grid grid-cols-2 gap-2">
            {(["A", "B", "C", "D", "E", "F"] as const).map((key) => {
              const raw = (entrada as any)[key];
              const label = (entradaLabels as any)[key] ?? key;

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
                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                  <p className="text-sm font-bold text-slate-900">{valor}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
