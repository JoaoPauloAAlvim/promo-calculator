"use client";

import type { HistoricoItem } from "@/lib/types";
import { getPromoStatus } from "@/lib/promoStatus";
import { getPromoChip, getAnaliseChip } from "@/lib/chips";

type Props = {
  item: HistoricoItem;
  excluindoId: number | null;

  modoSelecao: boolean;
  selecionado: boolean;
  onToggleSelect: () => void;

  onOpen: () => void;
  onDelete: () => void;
};

export function HistoricoCard({
  item,
  excluindoId,
  modoSelecao,
  selecionado,
  onToggleSelect,
  onOpen,
  onDelete,
}: Props) {
  const entrada = item.resultado?.entrada ?? {};
  const metas = item.resultado?.metas ?? {};

  const nomeProduto = (entrada as any)?.produto_nome ?? (entrada as any)?.produto ?? "";

  const lucroMedio = metas?.lucro_med_dia ?? metas?.lucro_medio_diario_promo;
  const metaDia = metas?.meta_unid_dia;

  const ipcaAplicado = Boolean((entrada as any)?.ipca_aplicado);
const metaDiaIpca = (metas as any)?.meta_unid_dia_ipca;


  const vendaReal = metas?.venda_real as { situacao?: string } | undefined;
  const sit = vendaReal?.situacao ?? null;

  const inicio = (entrada as any)?.data_inicio_promocao as string | undefined;
  const fim = (entrada as any)?.data_fim_promocao as string | undefined;

  const promoStatus = getPromoStatus(inicio, fim);
  const promoChip = getPromoChip(promoStatus);
  const analiseChip = getAnaliseChip(sit);

  return (
    <button
      type="button"
      onClick={() => {
        if (modoSelecao) return onToggleSelect();
        onOpen();
      }}
      style={{
        borderRadius: 18,
        width: "100%",
        minHeight: 190,
        border: selecionado ? "2px solid #4f46e5" : "1px solid #d1d5db",
        backgroundColor: "#ffffff",
        padding: "16px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
        cursor: "pointer",
        position: "relative",
      }}
      className="card-historico flex flex-col gap-2 text-left focus:outline-none"
    >
      {modoSelecao && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 18,
            height: 18,
            borderRadius: 6,
            border: selecionado ? "2px solid #4f46e5" : "2px solid #cbd5e1",
            backgroundColor: selecionado ? "#4f46e5" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {selecionado ? "✓" : ""}
        </div>
      )}

      {!modoSelecao && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "12px",
            color: "#dc2626",
            fontWeight: 700,
          }}
        >
          {excluindoId === item.id ? "…" : "✕"}
        </button>
      )}

      <div className="flex items-start justify-between gap-2 pr-5">
        <p className="text-xs font-semibold text-slate-900 line-clamp-2 flex-1">
          {nomeProduto || "Produto não informado"}
        </p>
        <p className="text-[11px] text-slate-500 whitespace-nowrap text-right">
          {new Date(item.dataHora).toLocaleString("pt-BR")}
        </p>
      </div>

      <div className="mt-1 flex flex-col gap-1 text-[11px] text-slate-600 pr-5">
        {Number.isFinite(Number(lucroMedio)) && Number(lucroMedio) > 0 && (
          <span className="inline-flex items-center gap-1">
            <span>
              Lucro/dia:{" "}
              <strong>
                R${" "}
                {Number(Number(lucroMedio)).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </span>
          </span>
        )}

        {Number.isFinite(Number(metaDia)) && Number(metaDia) > 0 && (
          <span className="inline-flex items-center gap-1">
            <span>
              Meta/dia: <strong>{Number(metaDia)}</strong>
            </span>
          </span>
        )}

        {ipcaAplicado && Number.isFinite(Number(metaDiaIpca)) && Number(metaDiaIpca) > 0 && (
  <span className="inline-flex items-center gap-1">
    <span>
      Meta/dia (IPCA): <strong>{Number(metaDiaIpca)}</strong>
    </span>
  </span>
)}


        <span
          style={{
            marginTop: "2px",
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: "10px",
            fontSize: "10px",
            fontWeight: 600,
            backgroundColor: analiseChip.bg,
            color: analiseChip.color,
            border: `1px solid ${analiseChip.border}`,
            alignSelf: "flex-start",
          }}
        >
          {analiseChip.label}
        </span>

        <span
          style={{
            marginTop: "2px",
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: "10px",
            fontSize: "10px",
            fontWeight: 600,
            backgroundColor: promoChip.bg,
            color: promoChip.color,
            border: `1px solid ${promoChip.border}`,
            alignSelf: "flex-start",
          }}
        >
          {promoChip.label}
        </span>
      </div>

      {!modoSelecao && (
        <span className="mt-1 ml-auto text-slate-400 text-sm transition-transform group-hover:translate-x-0.5">
          ▸
        </span>
      )}

    </button>
  );
}
