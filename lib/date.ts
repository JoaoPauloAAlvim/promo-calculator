export const parseISODateLocal = (iso?: string): Date | null => {
  if (!iso || typeof iso !== "string") return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(y, mo - 1, d);
};

export const formatDateBR = (value?: string | Date): string => {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISODateLocal(value) : value;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const calcDiasPromoInclusivo = (inicio?: string, fim?: string): number | null => {
  const i = parseISODateLocal(inicio);
  const f = parseISODateLocal(fim);
  if (!i || !f) return null;
  const diff = f.getTime() - i.getTime();
  if (diff < 0) return null;
  return diff / (1000 * 60 * 60 * 24) + 1;
};

export const getYesterdayISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getAcompDateISO = (inicio?: string): string => {
  const ontem = getYesterdayISO();
  const dOntem = parseISODateLocal(ontem);
  const dIni = parseISODateLocal(inicio);
  if (dOntem && dIni && dOntem < dIni) return inicio || ontem;
  return ontem;
};

export function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}









