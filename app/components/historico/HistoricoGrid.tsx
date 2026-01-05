"use client";

import type { HistoricoItem } from "@/lib/types";
import { HistoricoCard } from "./HistoricoCard";

type Props = {
  itens: HistoricoItem[];
  excluindoId: number | null;
  onOpen: (item: HistoricoItem) => void;
  onDelete: (id: number) => void;
};

export function HistoricoGrid({ itens, excluindoId, onOpen, onDelete }: Props) {
  return (
    <div className="cards-historico-grid">
      {itens.map((item) => (
        <HistoricoCard
          key={item.id}
          item={item}
          excluindoId={excluindoId}
          onOpen={() => onOpen(item)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  );
}
