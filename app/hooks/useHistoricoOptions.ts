"use client";

import { useEffect, useState } from "react";
import { getHistoricoOptions } from "@/lib/api/historico";

type Args = {
  produto?: string;
  marca?: string;
  categoria?: string;
  comprador?: string;
  statusPromo?: string;
  statusAnalise?: string;
};

export function useHistoricoOptions(args: Args) {
  const [opcoesMarca, setOpcoesMarca] = useState<string[]>([]);
  const [opcoesCategoria, setOpcoesCategoria] = useState<string[]>([]);
  const [opcoesComprador, setOpcoesComprador] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingOptions(true);

        const data = await getHistoricoOptions({
          produto: args.produto || undefined,
          marca: args.marca || undefined,
          categoria: args.categoria || undefined,
          comprador: args.comprador || undefined,
          statusPromo: args.statusPromo || undefined,
          statusAnalise: args.statusAnalise || undefined,
        });

        if (!alive) return;

        setOpcoesMarca(Array.isArray(data.marcas) ? data.marcas : []);
        setOpcoesCategoria(Array.isArray(data.categorias) ? data.categorias : []);
        setOpcoesComprador(Array.isArray(data.compradores) ? data.compradores : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setOpcoesMarca([]);
        setOpcoesCategoria([]);
        setOpcoesComprador([]);
      } finally {
        if (alive) setLoadingOptions(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    args.produto,
    args.marca,
    args.categoria,
    args.comprador,
    args.statusPromo,
    args.statusAnalise,
  ]);

  return {
    opcoesMarca,
    opcoesCategoria,
    opcoesComprador,
    loadingOptions,
  };
}
