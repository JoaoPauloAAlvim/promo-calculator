import type { ChipStyle, PromoStatus } from "./types";

export const getPromoChip = (status: PromoStatus): ChipStyle => {
  if (status === "NAO_INICIOU") {
    return { label: "Não iniciada", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
  }
  if (status === "EM_ANDAMENTO") {
    return { label: "Em andamento", bg: "#ecfeff", color: "#0e7490", border: "#a5f3fc" };
  }
  if (status === "ENCERRADA") {
    return { label: "Encerrada", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
  }
  return { label: "Sem datas", bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" };
};

export const getAnaliseChip = (situacao?: string | null): ChipStyle => {
  const sit = (situacao || "").toUpperCase();

  if (sit === "ACIMA") {
    return { label: "Analisada – ACIMA", bg: "#ecfdf3", color: "#047857", border: "#6ee7b7" };
  }
  if (sit === "ABAIXO") {
    return { label: "Analisada – ABAIXO", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
  }
  if (sit === "IGUAL") {
    return { label: "Analisada – IGUAL", bg: "#fffbeb", color: "#92400e", border: "#fcd34d" };
  }
  return { label: "Pendente de análise", bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" };
};
