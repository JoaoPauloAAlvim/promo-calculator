import { api } from "./client";

export type CompradoresResponse = {
  compradores: string[];
};

export async function getCompradores(signal?: AbortSignal) {
  return api<CompradoresResponse>("/api/meta/compradores", {
    method: "GET",
    signal,
  });
}

export type ProdutoSugestaoResponse = {
  confidence: "HIGH" | "LOW";
  sugestao: null | { produto: string; marca: string; categoria: string };
  candidatos: Array<{ produto: string; marca: string; categoria: string }>;
};

export async function getProdutoSugestao(produto: string, signal?: AbortSignal) {
  const sp = new URLSearchParams();
  sp.set("produto", produto);

  return api<ProdutoSugestaoResponse>(`/api/meta/produto-sugestao?${sp.toString()}`, {
    method: "GET",
    signal,
  });
}
