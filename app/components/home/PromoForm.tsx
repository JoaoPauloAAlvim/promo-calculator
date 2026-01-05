"use client";

import type { FormState } from "@/lib/types";

type Campo = { id: keyof FormState; label: string; placeholder?: string };

type Props = {
  form: FormState;
  campos: Campo[];
  loading: boolean;
  onChange: (id: keyof FormState, value: string) => void;
  onCalculate: () => void;
};

export function PromoForm({ form, campos, loading, onChange, onCalculate }: Props) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <section className="bg-white shadow-md p-6 md:p-7 mx-auto max-w-[520px] rounded-[18px] border-[3px] border-slate-400 box-border">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2 text-center">
          Informe os dados da promoção
        </h2>

        <div className="mx-auto max-w-[260px]">
          {/* Produto */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Nome do produto
            </label>
            <input
              type="text"
              placeholder="Ex: CREME DENTAL COLGATE TRIPLA AÇÃO 120G"
              value={form.produto}
              onChange={(e) => onChange("produto", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 box-border"
            />
          </div>

          {/* Categoria */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Categoria do produto
            </label>
            <input
              type="text"
              placeholder="Ex: HIGIENE ORAL"
              value={form.categoria}
              onChange={(e) => onChange("categoria", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 box-border"
            />
          </div>

          {/* Comprador */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Comprador
            </label>
            <input
              type="text"
              placeholder="Ex: FLÁVIA / JÉSSICA"
              value={form.comprador}
              onChange={(e) => onChange("comprador", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 box-border"
            />
          </div>

          {/* Marca */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Marca
            </label>
            <input
              type="text"
              placeholder="Ex: COLGATE"
              value={form.marca}
              onChange={(e) => onChange("marca", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 box-border"
            />
          </div>

          {/* Datas */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Data de início da promoção
            </label>
            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => onChange("dataInicio", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 box-border"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Data de fim da promoção
            </label>
            <input
              type="date"
              value={form.dataFim}
              onChange={(e) => onChange("dataFim", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 box-border"
            />
          </div>

          {/* Campos A–F */}
          {campos.map((campo) => (
            <div key={campo.id} className="mb-4">
              <label className="block mb-1.5 text-sm font-medium text-slate-700">
                {campo.label}
              </label>
              <input
                type="text"
                placeholder={campo.placeholder}
                value={form[campo.id]}
                onChange={(e) => onChange(campo.id, e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 box-border"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCalculate}
            disabled={loading}
            className="mt-5 px-8 py-2 rounded-[10px] bg-indigo-600 text-white font-semibold text-sm border-0 shadow disabled:opacity-70 disabled:cursor-default"
          >
            {loading ? "Calculando..." : "Calcular ➜"}
          </button>
        </div>
      </section>
    </main>
  );
}
