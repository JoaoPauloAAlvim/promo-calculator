"use client";

import { useEffect, useMemo, useState } from "react";
import type { HistoricoItem } from "@/lib/types";
import { getHistorico } from "@/lib/api/historico";

export type UseHistoricoArgs = {
  produto?: string;
  marca?: string;
  categoria?: string;
  comprador?: string;
  tipoPromocao?: string
  statusPromo?: string;
  statusAnalise?: string;
  sort?: string;
  page: number;
  pageSize: number;
  reloadToken: number;
};


export function useHistorico({
  produto,
  marca,
  categoria,
  comprador,
  tipoPromocao,
  statusPromo,
  statusAnalise,
  page,
  sort,
  pageSize,
  reloadToken,
}: UseHistoricoArgs) {
  const [itens, setItens] = useState<HistoricoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      produto: produto || "",
      marca: marca || "",
      categoria: categoria || "",
      comprador: comprador || "",
      tipoPromocao : tipoPromocao || "",
      statusPromo: statusPromo || "",
      statusAnalise: statusAnalise || "",
      sort: sort || "RECENTE",
      page,
      pageSize,
    }),
    [produto, marca, categoria, comprador,tipoPromocao, statusPromo, statusAnalise, sort, page, pageSize]
  );


  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        const data = await getHistorico({
          produto: params.produto || undefined,
          marca: params.marca || undefined,
          categoria: params.categoria || undefined,
          comprador: params.comprador || undefined,
          tipoPromocao: params.tipoPromocao || undefined,
          statusPromo: params.statusPromo || undefined,
          statusAnalise: params.statusAnalise || undefined,
          sort: (params.sort as any) || "RECENTE",
          page: params.page,
          pageSize: params.pageSize,
        });


        if (!alive) return;

        setItens(Array.isArray(data.itens) ? data.itens : []);
        setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
        setHasMore(Boolean(data.hasMore));
      } catch (err: any) {
        console.error(err);
        if (!alive) return;

        setErro(err?.message || "Erro ao buscar histórico. Verifique a conexão.");
        setItens([]);
        setTotalCount(0);
        setHasMore(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [params, reloadToken]);

  return { itens, totalCount, hasMore, loading, erro };
}
