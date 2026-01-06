"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { AnalisePromo, HistoricoItem } from "@/lib/types";
import { formatBR, toNumberBR } from "@/lib/format";
import {
  formatDateBR,
  calcDiasPromoInclusivo,
  getAcompDateISO,
} from "@/lib/date";
import { getPromoStatus } from "@/lib/promoStatus";
import { entradaLabels } from "@/lib/entradaLabels";
import { ActionModal } from "@/app/components/ui/ActionModal";
import { DreModal } from "@/app/components/historico/DreModal";
import { AcompanhamentoModal } from "@/app/components/historico/AcompanhamentoModal";
import { getHistoricoById, patchVendaReal } from "@/lib/api/historico";
import { Spinner } from "../Spinner";

type Props = {
  open: boolean;
  item: HistoricoItem | null;
  onClose: () => void;

  onUpdateItem: (novo: HistoricoItem) => void;

  onReload: () => void;
};

export function HistoricoModal({ open, item, onClose, onUpdateItem, onReload }: Props) {
  const [dreAberto, setDreAberto] = useState(false);
  const [acompAberto, setAcompAberto] = useState(false);

  const [monData, setMonData] = useState<string>("");
  const [monVendido, setMonVendido] = useState<string>("");
  const [monEstoque, setMonEstoque] = useState<string>("");

  const [qtdVendida, setQtdVendida] = useState<string>("");
  const [analisePromo, setAnalisePromo] = useState<AnalisePromo | null>(null);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackVariant, setFeedbackVariant] = useState<"success" | "error" | "info">("info");

  const [loadingDetalhes, setLoadingDetalhes] = useState(false);


  function showFeedback(opts: { title: string; message: string; variant?: "success" | "error" | "info" }) {
    setFeedbackTitle(opts.title);
    setFeedbackMsg(opts.message);
    setFeedbackVariant(opts.variant || "info");
    setFeedbackOpen(true);
  }


  useEffect(() => {
    if (!open || !item) return;

    let alive = true;

    setDreAberto(false);
    setAcompAberto(false);

    setLoadingDetalhes(true);

    (async () => {
      try {
        const full = await getHistoricoById(item.id);

        if (!alive) return;

        onUpdateItem({
          ...item,
          dataHora: full.dataHora ?? item.dataHora,
          resultado: full.resultado ?? item.resultado,
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoadingDetalhes(false);
      }
    })();

    const inicio = item.resultado?.entrada?.data_inicio_promocao as string | undefined;
    setMonData(getAcompDateISO(inicio));
    setMonVendido("");
    setMonEstoque("");

    const vendaReal = item.resultado?.metas?.venda_real as
      | {
        qtd_vendida?: number;
        lucro_hist_periodo?: number;
        lucro_real_promo?: number;
        diff?: number;
        situacao?: "ACIMA" | "ABAIXO" | "IGUAL";
      }
      | undefined;

    if (vendaReal && vendaReal.qtd_vendida && !Number.isNaN(vendaReal.qtd_vendida)) {
      setQtdVendida(String(vendaReal.qtd_vendida));
      setAnalisePromo({
        lucroHistPeriodo: Number(vendaReal.lucro_hist_periodo || 0),
        lucroRealPromo: Number(vendaReal.lucro_real_promo || 0),
        diff: Number(vendaReal.diff || 0),
        situacao: (vendaReal.situacao as any) || "IGUAL",
      });
    } else {
      setQtdVendida("");
      setAnalisePromo(null);
    }

    return () => {
      alive = false;
    };
  }, [open, item?.id, onUpdateItem]);


  const entrada = item?.resultado?.entrada ?? {};
  const metas = item?.resultado?.metas ?? {};

  const nomeProdutoSelecionado =
    (entrada as any)?.produto_nome ?? (entrada as any)?.produto ?? "";

  const inicioPromo = (entrada as any)?.data_inicio_promocao as string | undefined;
  const fimPromo = (entrada as any)?.data_fim_promocao as string | undefined;

  const promoStatus = useMemo(() => getPromoStatus(inicioPromo, fimPromo), [inicioPromo, fimPromo]);

  const diasPromoCalc = useMemo(() => calcDiasPromoInclusivo(inicioPromo, fimPromo), [inicioPromo, fimPromo]);
  const diasPromoFallback = Number((entrada as any)?.C ?? (entrada as any)?.c);
  const diasPromoFinal =
    diasPromoCalc ?? (Number.isFinite(diasPromoFallback) ? diasPromoFallback : null);

  const podeAvaliar = !analisePromo && (promoStatus === "ENCERRADA" || promoStatus === "SEM_DATAS");

  const entradaEntries = useMemo(() => {
    const e = entrada ?? {};
    return Object.entries(e).filter(
      ([chave, valor]) =>
        valor !== undefined &&
        valor !== null &&
        chave !== "lucro_diario_hist" &&
        chave !== "produto_nome" &&
        chave !== "produto" &&
        chave !== "categoria" &&
        chave !== "comprador" &&
        chave !== "marca" &&
        chave !== "data_inicio_promocao" &&
        chave !== "data_fim_promocao" &&
        chave !== "C" &&
        chave !== "c"
    );
  }, [entrada]);

  async function avaliarResultado() {
    if (!item) return;

    const e = item.resultado?.entrada || {};
    const m = item.resultado?.metas || {};

    const qtd = toNumberBR(qtdVendida);
    if (!qtd || Number.isNaN(qtd) || qtd <= 0) {
      showFeedback({
        title: "Quantidade inválida",
        message: "Informe uma quantidade total vendida válida (maior que zero).",
        variant: "error",
      });
      return;
    }

    const lucroDiarioHist = Number((e as any).lucro_diario_hist);

    const dataInicio = (e as any).data_inicio_promocao as string | undefined;
    const dataFim = (e as any).data_fim_promocao as string | undefined;
    const diasPromo = calcDiasPromoInclusivo(dataInicio, dataFim) ?? Number((e as any).C ?? (e as any).c);

    const lucroUnitPromo = Number((m as any).lucro_unitario_promo);

    if (!Number.isFinite(lucroDiarioHist) || !Number.isFinite(diasPromo) || !Number.isFinite(lucroUnitPromo)) {
      showFeedback({
        title: "Não foi possível calcular",
        message:
          "Verifique se a duração (datas/C), o lucro diário histórico e o lucro unitário foram calculados corretamente.",
        variant: "error",
      });
      return;
    }


    const lucroHistPeriodo = lucroDiarioHist * diasPromo;
    const lucroRealPromo = lucroUnitPromo * qtd;
    const diff = lucroRealPromo - lucroHistPeriodo;

    const EPS = 0.01;
    let situacao: "ACIMA" | "ABAIXO" | "IGUAL";
    if (diff > EPS) situacao = "ACIMA";
    else if (diff < -EPS) situacao = "ABAIXO";
    else situacao = "IGUAL";

    setAnalisePromo({ lucroHistPeriodo, lucroRealPromo, diff, situacao });

    try {
      try {
        const resp = await patchVendaReal(item.id, {
          qtdVendida: qtd,
          lucroHistPeriodo,
          lucroRealPromo,
          diff,
          situacao,
        });

        if (resp?.resultado) {
          onUpdateItem({ ...item, resultado: resp.resultado });
        }

        onReload();
        showFeedback({
          title: "Análise salva",
          message: "A análise foi calculada e salva com sucesso.",
          variant: "success",
        });

      } catch (err: any) {
        console.error(err);
        showFeedback({
          title: "Erro ao salvar",
          message: err?.message || "Erro ao salvar análise.",
          variant: "error",
        });
      }

    } catch (err) {
      console.error(err);
      showFeedback({
        title: "Não foi possível salvar",
        message: "A análise foi calculada, mas não foi possível salvar no banco.",
        variant: "error",
      });
    }

  }

  if (!open || !item) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          zIndex: 50,
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            maxWidth: "720px",
            width: "100%",
            maxHeight: "85vh",
            overflowY: "auto",
            padding: "20px",
            position: "relative",
            border: "1px solid #e5e7eb",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          }}
        >
          <button
            onClick={() => {
              setDreAberto(false);
              setAcompAberto(false);
              onClose();
            }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              borderRadius: "999px",
              border: "none",
              padding: "4px 8px",
              fontSize: "12px",
              backgroundColor: "#f3f4f6",
              color: "#4b5563",
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <div style={{ marginBottom: "12px" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Simulação realizada em {new Date(item.dataHora).toLocaleString("pt-BR")}
            </p>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
              {nomeProdutoSelecionado || "Produto não informado"}
            </p>
          </div>

          {loadingDetalhes && (
            <div
              style={{
                marginTop: "10px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Spinner size={18} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563" }}>
                Carregando detalhes…
              </span>
            </div>
          )}

          {!loadingDetalhes && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Lucro diário histórico
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {`R$ ${formatBR(Number((entrada as any).lucro_diario_hist))}`}
                  </p>
                </div>

                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Lucro unitário na promoção
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {metas?.lucro_unitario_promo !== undefined
                      ? `R$ ${formatBR(Number(metas.lucro_unitario_promo))}`
                      : "—"}
                  </p>

                  <button
                    type="button"
                    onClick={() => setDreAberto(true)}
                    style={{
                      marginTop: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: "#ffffff",
                      color: "#4b5563",
                      cursor: "pointer",
                    }}
                  >
                    Ver detalhes ▸
                  </button>
                </div>

                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Meta de unidades por dia
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {metas.meta_unid_dia ?? "—"}{" "}
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid/dia</span>
                  </p>
                </div>

                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Meta de unidades no período
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {metas.meta_unid_total ?? "—"}{" "}
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid</span>
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Período da promoção
                  </p>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>
                    {formatDateBR(inicioPromo)}{" "}
                    <span style={{ color: "#6b7280", fontWeight: 600 }}>até</span>{" "}
                    {formatDateBR(fimPromo)}
                  </p>
                </div>

                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                    Duração da promoção
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {diasPromoFinal !== null ? (
                      <>
                        {Math.round(diasPromoFinal)}{" "}
                        <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>dias</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </p>

                  {inicioPromo && fimPromo && diasPromoCalc === null && (
                    <p style={{ marginTop: "4px", fontSize: "10px", color: "#b91c1c", fontWeight: 600 }}>
                      Datas inválidas (fim antes do início).
                    </p>
                  )}

                  {(() => {
                    const disabled = promoStatus !== "EM_ANDAMENTO";

                    const motivo =
                      promoStatus === "ENCERRADA"
                        ? "Promoção encerrada"
                        : promoStatus === "NAO_INICIOU"
                          ? "Promoção ainda não iniciou"
                          : promoStatus === "SEM_DATAS"
                            ? "Promoção sem datas"
                            : "Indisponível";

                    return (
                      <button
                        type="button"
                        disabled={disabled}
                        title={disabled ? "Acompanhamento disponível apenas durante o período da promoção." : ""}
                        onClick={() => {
                          if (disabled) return;

                          setMonData(getAcompDateISO(inicioPromo));
                          setMonVendido("");
                          setMonEstoque("");
                          setAcompAberto(true);
                        }}
                        style={{
                          marginTop: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "10px",
                          border: "1px solid #d1d5db",
                          padding: "4px 10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: disabled ? "#f3f4f6" : "#ffffff",
                          color: disabled ? "#9ca3af" : "#4b5563",
                          cursor: disabled ? "default" : "pointer",
                        }}
                      >
                        {disabled ? `Acompanhamento: ${motivo}` : "Acompanhar promoção ▸"}
                      </button>
                    );
                  })()}

                </div>
              </div>

              <div style={{ marginTop: "6px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
                  Dados informados na simulação
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px" }}>
                  <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                      Produto
                    </p>
                    <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                      {nomeProdutoSelecionado || "Produto não informado"}
                    </p>
                  </div>

                  <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                      Categoria do produto
                    </p>
                    <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                      {(entrada as any).categoria || "—"}
                    </p>
                  </div>

                  <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                      Comprador
                    </p>
                    <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                      {(entrada as any).comprador || "—"}
                    </p>
                  </div>

                  <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", padding: "6px 8px", backgroundColor: "#f9fafb" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                      Marca
                    </p>
                    <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                      {(entrada as any).marca || "—"}
                    </p>
                  </div>

                  {entradaEntries.map(([chave, valor]) => {
                    const label = (entradaLabels as any)[chave] ?? chave.replace(/_/g, " ");

                    const isNumero = typeof valor === "number";
                    const valorFormatado =
                      valor === undefined || valor === null
                        ? "—"
                        : isNumero
                          ? chave === "A"
                            ? String(Math.round(valor as number))
                            : formatBR(Number(valor))
                          : String(valor);

                    return (
                      <div
                        key={chave}
                        style={{
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                          padding: "6px 8px",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                          {label}
                        </p>
                        <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                          {valorFormatado}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px dashed #e5e7eb" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
                  Análise após encerramento da promoção
                </p>

                {promoStatus === "NAO_INICIOU" && (
                  <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>
                    Promoção ainda não começou. A análise só ficará disponível após a data de fim.
                  </p>
                )}

                {promoStatus === "EM_ANDAMENTO" && (
                  <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>
                    Promoção em andamento. Só é possível lançar o resultado após a data de fim.
                  </p>
                )}

                {podeAvaliar && (
                  <>
                    <div style={{ marginBottom: "8px" }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Quantidade TOTAL vendida na promoção
                      </label>

                      <input
                        type="text"
                        value={qtdVendida}
                        onChange={(ev) => setQtdVendida(ev.target.value)}
                        placeholder="Ex: 620"
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          border: "1px solid #d1d5db",
                          padding: "6px 10px",
                          fontSize: "12px",
                          backgroundColor: "#f9fafb",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                      <button
                        type="button"
                        onClick={avaliarResultado}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "#4f46e5",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Avaliar resultado da promoção
                      </button>
                    </div>
                  </>
                )}

                {analisePromo && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "8px 10px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                        Lucro histórico no período
                      </p>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                        {`R$ ${formatBR(analisePromo.lucroHistPeriodo)}`}
                      </p>
                    </div>

                    <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "8px 10px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                        Lucro REAL na promoção
                      </p>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                        {`R$ ${formatBR(analisePromo.lucroRealPromo)}`}
                      </p>
                    </div>

                    <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "8px 10px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                        Diferença vs histórico
                      </p>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: analisePromo.diff > 0 ? "#047857" : analisePromo.diff < 0 ? "#b91c1c" : "#111827",
                        }}
                      >
                        {`${analisePromo.diff >= 0 ? "+" : ""}R$ ${formatBR(analisePromo.diff)}`}
                      </p>
                    </div>

                    <div
                      style={{
                        gridColumn: "1 / -1",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        backgroundColor:
                          analisePromo.situacao === "ACIMA"
                            ? "#ecfdf3"
                            : analisePromo.situacao === "ABAIXO"
                              ? "#fef2f2"
                              : "#fffbeb",
                        padding: "8px 10px",
                        marginTop: "4px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color:
                            analisePromo.situacao === "ACIMA"
                              ? "#047857"
                              : analisePromo.situacao === "ABAIXO"
                                ? "#b91c1c"
                                : "#92400e",
                        }}
                      >
                        {analisePromo.situacao === "ACIMA" && "📈 Promoção ACIMA do histórico de lucro."}
                        {analisePromo.situacao === "ABAIXO" && "📉 Promoção ABAIXO do histórico de lucro."}
                        {analisePromo.situacao === "IGUAL" && "⚖ Promoção IGUAL ao histórico de lucro."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </>
          )}


        </div>
      </div>

      <DreModal
        open={dreAberto}
        onClose={() => setDreAberto(false)}
        entrada={item.resultado?.entrada}
        metas={item.resultado?.metas}
      />

      <AcompanhamentoModal
        open={acompAberto}
        item={item}
        monData={monData}
        monVendido={monVendido}
        monEstoque={monEstoque}
        setMonVendido={setMonVendido}
        setMonEstoque={setMonEstoque}
        onClose={() => setAcompAberto(false)}
        onItemUpdated={(novo) => onUpdateItem(novo)}
        onReload={onReload}
      />
      <ActionModal
        open={feedbackOpen}
        title={feedbackTitle}
        message={feedbackMsg}
        variant={feedbackVariant}
        onClose={() => setFeedbackOpen(false)}
        autoCloseMs={feedbackVariant === "success" ? 1500 : undefined}
      />
    </>
  );
}
