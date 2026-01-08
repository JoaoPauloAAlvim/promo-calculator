import { api } from "./client";

export type CalculoPayload = {
  produto: string;
  categoria: string;
  comprador: string;
  marca: string;
  dataInicio: string;
  dataFim: string;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
};

export type CalculoResponse = {
  entrada: Record<string, any>;
  metas: Record<string, any>;
};

export async function postCalculo(payload: CalculoPayload) {
  return api<CalculoResponse>("/api/calculo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
