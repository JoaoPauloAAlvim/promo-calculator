import type { PromoStatus } from "./types";
import { parseISODateLocal } from "./date";

export const getPromoStatus = (
  inicio?: string,
  fim?: string,
  hoje?: Date
): PromoStatus => {
  if (!inicio || !fim) return "SEM_DATAS";
  const i = parseISODateLocal(inicio);
  const f = parseISODateLocal(fim);
  if (!i || !f) return "SEM_DATAS";

  const h = hoje ?? new Date();
  const hojeDia = new Date(h.getFullYear(), h.getMonth(), h.getDate());

  const inicioDia = new Date(i.getFullYear(), i.getMonth(), i.getDate());
  const fimDia = new Date(f.getFullYear(), f.getMonth(), f.getDate());

  if (hojeDia < inicioDia) return "NAO_INICIOU";
  if (hojeDia > fimDia) return "ENCERRADA";
  return "EM_ANDAMENTO";
};
