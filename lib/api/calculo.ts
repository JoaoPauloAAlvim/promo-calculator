import { api } from "./client";
import type { Resultado } from "@/lib/types";

export type CalculoPayload = {
  produto: string;
  categoria: string;
  comprador: string;
  marca: string;
  dataInicio: string;
  dataFim: string;    
  A: number | string;
  B: number | string;
  C: number | string;
  D: number | string;
  E: number | string;
  F: number | string;
};

export async function calcularPromocao(payload: CalculoPayload) {
  return api<Resultado>("/api/calculo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
