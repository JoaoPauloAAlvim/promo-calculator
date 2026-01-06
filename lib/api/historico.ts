import { api } from "./client";
import type { HistoricoItem } from "@/lib/types";

export type HistoricoGetParams = {
  produto?: string;
  marca?: string;
  categoria?: string;
  comprador?: string;
  statusPromo?: string;
  statusAnalise?: string;
  sort?: HistoricoSort;   
  page: number;
  pageSize: number;
};

export type HistoricoGetResponse = {
  itens: HistoricoItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalCount: number;
};

export type HistoricoSort =
  | "RECENTE"
  | "ANTIGO"
  | "PRODUTO_AZ"
  | "PROMO_EM_ANDAMENTO"
  | "ANALISE_PENDENTE";


export async function getHistorico(params: HistoricoGetParams) {
  const sp = new URLSearchParams();
  if (params.produto) sp.set("produto", params.produto);
  if (params.marca) sp.set("marca", params.marca);
  if (params.categoria) sp.set("categoria", params.categoria);
  if (params.comprador) sp.set("comprador", params.comprador);
  if (params.statusPromo) sp.set("statusPromo", params.statusPromo);
  if (params.statusAnalise) sp.set("statusAnalise", params.statusAnalise);
  if (params.sort) sp.set("sort", params.sort);

  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));

  return api<HistoricoGetResponse>(`/api/historico?${sp.toString()}`, {
    method: "GET",
  });
}

export async function deleteHistorico(id: number) {
  return api<{ ok: boolean }>("/api/historico", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function patchVendaReal(id: number, payload: {
  qtdVendida: number;
  lucroHistPeriodo: number;
  lucroRealPromo: number;
  diff: number;
  situacao: "ACIMA" | "ABAIXO" | "IGUAL";
}) {
  return api<{ ok: boolean; resultado?: any }>(`/api/historico/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function patchMonitoramento(id: number, payload: {
  data: string;    
  vendido: number; 
  estoque: number;
}) {
  return api<{ ok: boolean; resultado?: any }>(`/api/historico/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monitoramento: payload }),
  });
}

export type HistoricoOptionsParams = {
  produto?: string;
  marca?: string;
  categoria?: string;
  comprador?: string;
  statusPromo?: string;
  statusAnalise?: string;
};

export type HistoricoOptionsResponse = {
  marcas: string[];
  categorias: string[];
  compradores: string[];
};

export async function getHistoricoOptions(params: HistoricoOptionsParams) {
  const sp = new URLSearchParams();
  if (params.produto) sp.set("produto", params.produto);
  if (params.marca) sp.set("marca", params.marca);
  if (params.categoria) sp.set("categoria", params.categoria);
  if (params.comprador) sp.set("comprador", params.comprador);
  if (params.statusPromo) sp.set("statusPromo", params.statusPromo);
  if (params.statusAnalise) sp.set("statusAnalise", params.statusAnalise);

  return api<HistoricoOptionsResponse>(`/api/historico/options?${sp.toString()}`, {
    method: "GET",
  });
}

export async function getHistoricoById(id: number) {
  return api<{ id: number; dataHora: string; resultado: any }>(`/api/historico/${id}`, {
    method: "GET",
  });
}

export async function deleteHistoricoMany(ids: number[]) {
  return api<{ ok: boolean; deleted: number }>("/api/historico", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

