import { useEffect, useMemo, useState } from "react";
import type { HistoricoFiltros, HistoricoItem } from "@/lib/types";

type UseHistoricoArgs = {
  filtros: HistoricoFiltros;
  page: number;
  pageSize: number;
  reloadToken: number;
};

export function useHistorico({ filtros, page, pageSize, reloadToken }: UseHistoricoArgs) {
  const [itens, setItens] = useState<HistoricoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (filtros.produto) params.set("produto", filtros.produto);
    if (filtros.marca) params.set("marca", filtros.marca);
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (filtros.comprador) params.set("comprador", filtros.comprador);
    if (filtros.statusPromo) params.set("statusPromo", filtros.statusPromo);
    if (filtros.statusAnalise) params.set("statusAnalise", filtros.statusAnalise);

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return `/api/historico?${params.toString()}`;
  }, [filtros, page, pageSize]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        const res = await fetch(url);
        const data = await res.json();

        if (!alive) return;

        if (!res.ok) {
          setErro(data?.error || "Erro ao carregar histórico no servidor.");
          setItens([]);
          setHasMore(false);
          setTotalCount(0);
          return;
        }

        setItens(Array.isArray(data.itens) ? data.itens : []);
        setHasMore(Boolean(data.hasMore));
        setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErro("Erro ao buscar histórico. Verifique a conexão.");
        setItens([]);
        setHasMore(false);
        setTotalCount(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [url, reloadToken]);

  return { itens, totalCount, hasMore, loading, erro };
}
