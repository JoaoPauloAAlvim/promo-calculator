export const LS_KEYS = {
  DEFAULT_BUYER: "levate:promo:defaultBuyer:v1",
} as const;

export type DefaultBuyer = {
  mode: "LISTA" | "OUTRO";
  value: string;
};
