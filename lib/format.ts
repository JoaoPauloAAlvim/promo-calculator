export const formatBR = (valor?: number): string => {
  if (valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPctBR = (v?: number | null): string => {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
};

export const  toNumberBR=(v: string): number => {
  return Number(v.trim().replace(/\./g, "").replace(",", "."));
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