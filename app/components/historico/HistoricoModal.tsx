"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useRef } from "react";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { useRouter } from "next/navigation";



type Props = {
  open: boolean;
  item: HistoricoItem | null;
  onClose: () => void;

  onUpdateItem: (novo: HistoricoItem) => void;

  onReload: () => void;

  modoSelecao?: boolean;
};

export function HistoricoModal({ open, item, onClose, onUpdateItem, onReload, modoSelecao = false }: Props) {
  const router = useRouter();

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

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openMainModal = open && !dreAberto && !acompAberto;

  const closeAll = useCallback(() => {
    setDreAberto(false);
    setAcompAberto(false);
    onClose();
  }, [onClose]);

  useModalA11y({
    open: openMainModal,
    focusRef: dialogRef,
    onEscape: closeAll,
  });




  useEffect(() => {
    if (!open || !item) return;

    const jaCompleto = (item.resultado?.entrada as any)?.lucro_diario_hist !== undefined;
    if (jaCompleto) {
      setLoadingDetalhes(false);
      return;
    }

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

    return () => {
      alive = false;
    };
  }, [open, item?.id]);

  const entrada = item?.resultado?.entrada ?? {};
  const metas = item?.resultado?.metas ?? {};

  const ipcaAplicado = Boolean((entrada as any)?.ipca_aplicado);
  const ipcaMsg = String((entrada as any)?.ipca_msg || "");
  const ipcaMsgBR = ipcaMsg
    .replace(/\b(\d{4})-(\d{2})\b/g, (_m, yyyy, mm) => `${mm}/${yyyy}`)
    .replace(/^IPCA aplicado/i, "Aplicado")
    .replace(/^IPCA não aplicado/i, "Não aplicado")
    .replace(/^Sem IPCA:/i, "Sem IPCA:");

  const ipcaFatorNum = Number((entrada as any)?.ipca_fator);
  const ipcaFatorTxt = Number.isFinite(ipcaFatorNum)
    ? ipcaFatorNum.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 6 })
    : "—";
  const ipcaVarPctTxt = Number.isFinite(ipcaFatorNum)
    ? ((ipcaFatorNum - 1) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"
    : "—";

  const lucroHistIpcaNum = Number((entrada as any)?.lucro_diario_hist_ipca);
  const metaDiaIpca = (metas as any)?.meta_unid_dia_ipca;
  const metaTotIpca = (metas as any)?.meta_unid_total_ipca;



  const vendaRealSalva = (metas as any)?.venda_real;

  const analiseSalva: AnalisePromo | null = (() => {
    if (!vendaRealSalva || typeof vendaRealSalva !== "object") return null;

    const lucroHistPeriodo = Number(vendaRealSalva.lucro_hist_periodo);
    const lucroRealPromo = Number(vendaRealSalva.lucro_real_promo);
    const diff = Number(vendaRealSalva.diff);
    const situacao = String(vendaRealSalva.situacao || "").toUpperCase();

    if (!Number.isFinite(lucroHistPeriodo) || !Number.isFinite(lucroRealPromo) || !Number.isFinite(diff)) return null;
    if (!["ACIMA", "ABAIXO", "IGUAL"].includes(situacao)) return null;

    return { lucroHistPeriodo, lucroRealPromo, diff, situacao: situacao as any };
  })();

  const analiseFinal = analisePromo ?? analiseSalva;


  const nomeProdutoSelecionado =
    (entrada as any)?.produto_nome ?? (entrada as any)?.produto ?? "";
  const tipoPromo = (entrada as any)?.tipo_promocao ?? "";


  const inicioPromo = (entrada as any)?.data_inicio_promocao as string | undefined;
  const fimPromo = (entrada as any)?.data_fim_promocao as string | undefined;

  const promoStatus = useMemo(() => getPromoStatus(inicioPromo, fimPromo), [inicioPromo, fimPromo]);

  const diasPromoCalc = useMemo(() => calcDiasPromoInclusivo(inicioPromo, fimPromo), [inicioPromo, fimPromo]);
  const diasPromoFallback = Number((entrada as any)?.C ?? (entrada as any)?.c);
  const diasPromoFinal =
    diasPromoCalc ?? (Number.isFinite(diasPromoFallback) ? diasPromoFallback : null);

  const podeAvaliar =
    !analiseFinal &&
    promoStatus === "ENCERRADA" &&
    Boolean(inicioPromo) &&
    Boolean(fimPromo) &&
    calcDiasPromoInclusivo(inicioPromo, fimPromo) !== null;



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
        chave !== "tipo_promocao" &&
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

    const lucroDiarioHist = Number(
      (e as any).lucro_diario_hist ??
      (m as any).lucro_med_dia ??
      (m as any).lucro_medio_diario_promo
    );

    let lucroUnitPromo = Number(
      (m as any).lucro_unitario_promo ??
      (m as any).lucro_unitario_com_adicional
    );

    if (!Number.isFinite(lucroUnitPromo)) {
      const D = Number((e as any).D ?? (e as any).d);
      const E = Number((e as any).E ?? (e as any).e);
      const F = Number((e as any).F ?? (e as any).f ?? 0);
      if (Number.isFinite(D) && Number.isFinite(E) && Number.isFinite(F)) {
        lucroUnitPromo = (D - E) + F;
      }
    }


    const dataInicio = (e as any).data_inicio_promocao as string | undefined;
    const dataFim = (e as any).data_fim_promocao as string | undefined;
    const diasPromo = calcDiasPromoInclusivo(dataInicio, dataFim) ?? Number((e as any).C ?? (e as any).c);



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
          ref={dialogRef}
          tabIndex={-1}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            maxWidth: "720px",
            width: "100%",
            maxHeight: "85vh",
            position: "relative",
            border: "1px solid #e5e7eb",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
          onMouseDown={(ev) => ev.stopPropagation()}
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

          <div
            style={{
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >

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
              {!modoSelecao && !loadingDetalhes && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const entrada = (item.resultado?.entrada ?? {}) as any;

                      const draft = {
                        produto: String(entrada.produto_nome ?? entrada.produto ?? ""),
                        categoria: String(entrada.categoria ?? ""),
                        comprador: String(entrada.comprador ?? ""),
                        marca: String(entrada.marca ?? ""),
                        tipoPromocao: String(entrada.tipo_promocao ?? ""),
                        dataInicio: String(entrada.data_inicio_promocao ?? ""),
                        dataFim: String(entrada.data_fim_promocao ?? ""),
                        dataBaseHistorico: String(entrada.data_base_historico ?? ""),
                        A: String(entrada.A ?? ""),
                        B: String(entrada.B ?? ""),
                        D: String(entrada.D ?? ""),
                        E: String(entrada.E ?? ""),
                        F: String(entrada.F ?? ""),
                      };

                      sessionStorage.setItem("simulador_draft", JSON.stringify(draft));
                    } catch { }

                    router.replace("/");
                  }}
                  style={{
                    marginTop: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: "#ffffff",
                    color: "#4b5563",
                    cursor: "pointer",
                  }}
                >
                  Duplicar no simulador
                </button>
              )}
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

                {ipcaMsg && (
                  <div
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: ipcaAplicado ? "#eff6ff" : "#f9fafb",
                      padding: "8px 10px",
                      fontSize: "12px",
                      color: "#111827",
                      fontWeight: 700,
                      marginBottom: "10px",
                    }}
                  >
                    IPCA aplicado: <strong>{ipcaAplicado ? "Sim" : "Não"}</strong> — {ipcaMsgBR}
                    {ipcaAplicado && Number.isFinite(ipcaFatorNum) ? (
                      <span style={{ marginLeft: 6, fontWeight: 600, color: "#374151" }}>
                        (fator {ipcaFatorTxt} | {ipcaVarPctTxt})
                      </span>
                    ) : null}
                  </div>
                )}

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

                    {!modoSelecao && (
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
                    )}

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

                    {!modoSelecao && (
                      <>
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
                      </>
                    )}


                  </div>
                </div>

                {ipcaAplicado && (
                  <div style={{ marginBottom: "14px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "6px" }}>
                      Metas com IPCA
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "8px",
                      }}
                    >
                      {/* 4 cards IPCA */}
                      <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#eff6ff", padding: "8px 10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>Lucro diário histórico (IPCA)</p>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                          {Number.isFinite(lucroHistIpcaNum) ? `R$ ${formatBR(lucroHistIpcaNum)}` : "—"}
                        </p>
                      </div>

                      <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#eff6ff", padding: "8px 10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>Meta de unidades por dia (IPCA)</p>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                          {metaDiaIpca ?? "—"} <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid/dia</span>
                        </p>
                      </div>

                      <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#eff6ff", padding: "8px 10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>Meta de unidades no período (IPCA)</p>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                          {metaTotIpca ?? "—"} <span style={{ fontSize: "11px", fontWeight: 400, color: "#6b7280" }}>unid</span>
                        </p>
                      </div>

                      <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#eff6ff", padding: "8px 10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>Fator IPCA</p>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                          {ipcaFatorTxt} <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280" }}>({ipcaVarPctTxt})</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}


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

                    <div
                      style={{
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        padding: "6px 8px",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                        Tipo da promoção
                      </p>
                      <p style={{ fontSize: "13px", color: "#111827", fontWeight: 700 }}>
                        {tipoPromo || "—"}
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
                      const fallback = String(chave)
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (m) => m.toUpperCase());

                      const label = (entradaLabels as any)[chave] ?? fallback;


                      const isNumero = typeof valor === "number";
                      const isBool = typeof valor === "boolean";
                      const isISODate = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);

                      const formatMonthBR = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

                      let valorFormatado = "—";
                      if (chave === "ipca_aplicado") {
                        valorFormatado = ipcaAplicado ? "Sim" : "Não";
                      } else if (chave === "ipca_msg") {
                        valorFormatado = ipcaMsgBR || "—";
                      }


                      if (valor !== undefined && valor !== null) {
                        if (isBool) {
                          valorFormatado = valor ? "Sim" : "Não";
                        } else if (isNumero) {
                          valorFormatado =
                            chave === "A"
                              ? String(Math.round(valor as number))
                              : formatBR(Number(valor));
                        } else if (isISODate) {
                          if (["ipca_mes_base", "ipca_mes_ref", "data_base_historico"].includes(chave)) {
                            valorFormatado = formatMonthBR(valor as string);
                          } else {
                            valorFormatado = formatDateBR(valor as string);
                          }
                        }

                      }

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

                        {analiseFinal && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const vr = (metas as any)?.venda_real;
                                if (vr?.qtd_vendida != null) setQtdVendida(String(vr.qtd_vendida));
                                setAnalisePromo(null);
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "10px",
                                border: "1px solid #d1d5db",
                                backgroundColor: "#ffffff",
                                color: "#4b5563",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Reavaliar
                            </button>
                          </div>
                        )}


                        <input
                          type="text"
                          value={qtdVendida}
                          onChange={(ev) => setQtdVendida(ev.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              avaliarResultado();
                            }
                          }}

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

                  {analiseFinal && (
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
                          {`R$ ${formatBR(analiseFinal.lucroHistPeriodo)}`}
                        </p>
                      </div>

                      <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "8px 10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" }}>
                          Lucro REAL na promoção
                        </p>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                          {`R$ ${formatBR(analiseFinal.lucroRealPromo)}`}
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
                            color: analiseFinal.diff > 0 ? "#047857" : analiseFinal.diff < 0 ? "#b91c1c" : "#111827",
                          }}
                        >
                          {`${analiseFinal.diff >= 0 ? "+" : ""}R$ ${formatBR(analiseFinal.diff)}`}
                        </p>
                      </div>

                      <div
                        style={{
                          gridColumn: "1 / -1",
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          backgroundColor:
                            analiseFinal.situacao === "ACIMA"
                              ? "#ecfdf3"
                              : analiseFinal.situacao === "ABAIXO"
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
                              analiseFinal.situacao === "ACIMA"
                                ? "#047857"
                                : analiseFinal.situacao === "ABAIXO"
                                  ? "#b91c1c"
                                  : "#92400e",
                          }}
                        >
                          {analiseFinal.situacao === "ACIMA" && " Promoção ACIMA do histórico de lucro."}
                          {analiseFinal.situacao === "ABAIXO" && " Promoção ABAIXO do histórico de lucro."}
                          {analiseFinal.situacao === "IGUAL" && " Promoção IGUAL ao histórico de lucro."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </>
            )}
          </div>

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
