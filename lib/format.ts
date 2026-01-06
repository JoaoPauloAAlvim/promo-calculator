export const formatBR = (valor?: number): string => {
  if (valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPctBR = (v?: number | null): string => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
};

export function toNumberBR(v: any): number {
  if (v === null || v === undefined) return NaN;

  if (typeof v === "number") return v;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return NaN;

    const limpo = s.replace(/\./g, "").replace(",", ".");
    const n = Number(limpo);
    return Number.isFinite(n) ? n : NaN;
  }

  if (typeof v === "boolean") return v ? 1 : 0;

  return NaN;
}


export const parseBR = (valor: string): number => {
    if (!valor) return NaN;
    const limpo = valor.trim().replace(/\./g, "").replace(",", ".");
    return Number(limpo);
};

export const toNumericString = (v: any): string => {
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return v;
    return "";
  };