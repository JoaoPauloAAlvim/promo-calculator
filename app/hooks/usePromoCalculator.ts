"use client";

import { useState } from "react";
import type { FormState, Resultado } from "@/lib/types";
import { parseISODateLocal } from "@/lib/date";
import { postCalculo } from "@/lib/api/calculo";

const parseBR = (valor: string): number => {
  if (!valor) return NaN;
  const limpo = valor.trim().replace(/\./g, "").replace(",", ".");
  return Number(limpo);
};

export function usePromoCalculator(initialForm: FormState) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calcular() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { produto, categoria, comprador, marca, dataInicio, dataFim } = form;

      if (!produto.trim()) {
        setError("Informe o nome do produto.");
        return;
      }

      if (!dataInicio || !dataFim) {
        setError("Informe a data de início e a data de fim da promoção.");
        return;
      }

      const inicioDia = parseISODateLocal(dataInicio);
      const fimDia = parseISODateLocal(dataFim);

      if (!inicioDia || !fimDia) {
        setError("Data de início ou fim inválida.");
        return;
      }

      const diffMs = fimDia.getTime() - inicioDia.getTime();
      if (diffMs < 0) {
        setError("A data de fim da promoção deve ser maior ou igual à data de início.");
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
        setError("Preencha todos os campos numéricos antes de calcular.");
        return;
      }

      if ([A, B, D, E, F].some((v) => Number.isNaN(v))) {
        setError("Todos os campos numéricos devem ser válidos. Use vírgula como separador decimal (ex: 4,79).");
        return;
      }

      if (A <= 0) {
        setError("O período histórico (dias) deve ser maior que zero.");
        return;
      }

      if (C <= 0) {
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
    } catch (err: any) {
      setError(err?.message || "Erro ao processar o cálculo na API.");
    } finally {
      setLoading(false);
    }
  }

  function fecharResultado() {
    setResult(null);
    setError(null);
    setForm(initialForm);
  }

  function fecharErro() {
    setError(null);
  }

  return {
    form,
    setForm,
    result,
    loading,
    error,
    calcular,
    fecharResultado,
    fecharErro,
  };
}
