import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { getAuthUser, requireAuth } from "@/lib/authGuard";
import { toNumberBR } from "@/lib/format";
import { calcDiasPromoInclusivo, isISODate } from "@/lib/date";

export const runtime = "nodejs";


export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const denied = requireAuth();
    if (denied) return denied;

    const body = await req.json();
    let {
      produto,
      categoria,
      marca,
      tipoPromocao,
      dataInicio,
      dataFim,
      dataBaseHistorico,
      A,
      B,
      C,
      D,
      E,
      F,
    } = body;


    const user = getAuthUser();

    produto = typeof produto === "string" ? produto.trim() : "";
    categoria = typeof categoria === "string" ? categoria.trim() : "";
    marca = typeof marca === "string" ? marca.trim() : "";
    tipoPromocao = typeof tipoPromocao === "string" ? tipoPromocao.trim().toUpperCase() : "";
    dataBaseHistorico = typeof dataBaseHistorico === "string" ? dataBaseHistorico.trim() : "";

    const hasInicio = typeof dataInicio === "string" && dataInicio.trim() !== "";
    const hasFim = typeof dataFim === "string" && dataFim.trim() !== "";

    let diasPromoCalculado: number | null = null;

    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const dbUser = await db("users")
      .select("nome", "email")
      .where({ id: user.uid })
      .first();

    const compradorAuto = String(dbUser?.nome || dbUser?.email || "")
      .trim()
      .toUpperCase();

    if (!compradorAuto) {
      return NextResponse.json({ error: "Usuário sem nome/email cadastrado." }, { status: 500 });
    }

    if (hasInicio || hasFim) {
      if (!hasInicio || !hasFim) {
        return NextResponse.json(
          { error: "Para calcular o período da promoção, informe dataInicio e dataFim." },
          { status: 400 }
        );
      }

      if (!isISODate(dataInicio) || !isISODate(dataFim)) {
        return NextResponse.json(
          { error: "Datas inválidas. Use o formato YYYY-MM-DD para dataInicio e dataFim." },
          { status: 400 }
        );
      }

      const c = calcDiasPromoInclusivo(dataInicio, dataFim);
      if (c == null) {
        return NextResponse.json(
          { error: "Datas inválidas. dataFim deve ser igual ou posterior a dataInicio." },
          { status: 400 }
        );
      }

      diasPromoCalculado = Math.round(c);
    }

    if (!produto) {
      return NextResponse.json(
        { error: "Informe o nome do produto." },
        { status: 400 }
      );
    }

    if (produto.length > 200) {
      return NextResponse.json(
        { error: "O nome do produto é muito longo. Resuma a descrição." },
        { status: 400 }
      );
    }

    if (!["INTERNA", "SCANNTECH"].includes(tipoPromocao)) {
      return NextResponse.json(
        { error: "Informe o tipo da promoção (INTERNA ou SCANNTECH)." },
        { status: 400 }
      );
    }

    function toNumber(v: unknown, field: string) {
      const n =
        typeof v === "number" ? v :
          typeof v === "string" ? toNumberBR(v) :
            NaN;

      if (!Number.isFinite(n)) {
        return NaN;
      }
      return n;
    }

    function normalizeMonthStart(raw: unknown): string | null {
      const s = String(raw ?? "").trim();
      if (!s) return null;

      if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;

      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s.slice(0, 7)}-01`;

      if (/^\d{2}\/\d{4}$/.test(s)) {
        const [mm, yyyy] = s.split("/");
        return `${yyyy}-${mm}-01`;
      }

      return null;
    }

    function monthFromISODate(raw: unknown): string | null {
      const s = String(raw ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
      return `${s.slice(0, 7)}-01`;
    }


    const periodoHistorico = toNumber(A, "PeriodoHistorico (A)");
    const lucroTotalHistorico = toNumber(B, "LucroTotalHistorico (B)");
    const diasPromo = diasPromoCalculado ?? toNumber(C, "DiasPromocao (C)");
    const precoPromo = toNumber(D, "PrecoPromocional (D)");
    const custoUnit = toNumber(E, "CustoUnitario (E)");
    const receitaAdicional = toNumber(F, "ReceitaAdicional (F)");

    const camposInvalidos: string[] = [];
    if (!Number.isFinite(periodoHistorico))
      camposInvalidos.push("Período histórico (A)");
    if (!Number.isFinite(lucroTotalHistorico))
      camposInvalidos.push("Lucro total histórico (B)");
    if (!Number.isFinite(diasPromo))
      camposInvalidos.push("Duração da promoção (C)");
    if (!Number.isFinite(precoPromo))
      camposInvalidos.push("Preço promocional (D)");
    if (!Number.isFinite(custoUnit))
      camposInvalidos.push("Custo unitário (E)");
    if (!Number.isFinite(receitaAdicional))
      camposInvalidos.push("Receita adicional (F)");

    if (camposInvalidos.length > 0) {
      return NextResponse.json(
        {
          error:
            "Todos os campos numéricos devem ser válidos. Verifique: " +
            camposInvalidos.join(", ") +
            ". Use vírgula como separador decimal (ex: 4,79).",
        },
        { status: 400 }
      );
    }

    if (periodoHistorico <= 0) {
      return NextResponse.json(
        {
          error:
            "O período histórico (dias) deve ser maior que zero. Ajuste o campo Período histórico (A).",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(periodoHistorico)) {
      return NextResponse.json(
        {
          error:
            "O período histórico (A) deve ser informado em dias inteiros (ex: 30).",
        },
        { status: 400 }
      );
    }

    if (diasPromo <= 0) {
      return NextResponse.json(
        {
          error:
            "A duração da promoção (dias) deve ser maior que zero. Ajuste o campo Duração da promoção (C).",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(diasPromo)) {
      return NextResponse.json(
        {
          error:
            "A duração da promoção (C) deve ser informada em dias inteiros.",
        },
        { status: 400 }
      );
    }

    if (precoPromo < 0) {
      return NextResponse.json(
        {
          error:
            "O preço promocional (D) não pode ser negativo. Verifique o valor informado.",
        },
        { status: 400 }
      );
    }

    if (custoUnit < 0) {
      return NextResponse.json(
        {
          error:
            "O custo unitário (E) não pode ser negativo. Verifique o cadastro/custo do produto.",
        },
        { status: 400 }
      );
    }

    if (receitaAdicional < 0) {
      return NextResponse.json(
        {
          error:
            "A receita adicional/reembolso (F) não pode ser negativa. Se for desconto de custo, ajuste o custo unitário.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(diasPromo) || diasPromo <= 0) {
      return NextResponse.json(
        { error: "Campo inválido: DiasPromocao (C). Informe um inteiro maior que zero." },
        { status: 400 }
      );
    }

    const lucroDiarioHist = lucroTotalHistorico / periodoHistorico;

    const lucroUnitarioSemAdicional = precoPromo - custoUnit;
    const lucroUnitarioComAdicional =
      lucroUnitarioSemAdicional + receitaAdicional;

    const markupComAdicional =
      custoUnit > 0 ? lucroUnitarioComAdicional / custoUnit : null;

    if (
      !Number.isFinite(lucroUnitarioComAdicional) ||
      lucroUnitarioComAdicional <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "O lucro unitário na promoção está zerado ou negativo. Ajuste preço, custo ou reembolso para que a promoção tenha lucro por unidade.",
        },
        { status: 400 }
      );
    }

    const metaUnidDia = lucroDiarioHist / lucroUnitarioComAdicional;
    const metaUnidTotal = metaUnidDia * diasPromo;

    const mesRef = monthFromISODate(dataInicio);
    const mesBase = normalizeMonthStart(dataBaseHistorico);

    let ipca_aplicado = false;
    let ipca_msg = "Sem IPCA: mês base do histórico não informado.";
    let ipca_mes_base: string | null = mesBase;
    let ipca_mes_ref: string | null = mesRef;

    let ipca_indice_base: number | null = null;
    let ipca_indice_ref: number | null = null;
    let ipca_fator: number | null = null;

    let lucro_diario_hist_ipca: number | null = null;
    let meta_unid_dia_ipca: number | null = null;
    let meta_unid_total_ipca: number | null = null;

    if (dataBaseHistorico && !mesBase) {
      ipca_msg = "Sem IPCA: mês base do histórico inválido. Use YYYY-MM (ex: 2022-07).";
    } else if (mesBase && !mesRef) {
      ipca_msg = "Sem IPCA: dataInicio não informada/ inválida para referência do IPCA.";
    } else if (mesBase && mesRef) {
      try {
        const [rowBase, rowRef] = await Promise.all([
          db("ipca_mensal").select("indice").where({ mes: mesBase }).first(),
          db("ipca_mensal").select("indice").where({ mes: mesRef }).first(),
        ]);

        const baseN = rowBase?.indice != null ? Number(rowBase.indice) : NaN;
        const refN = rowRef?.indice != null ? Number(rowRef.indice) : NaN;

        ipca_indice_base = Number.isFinite(baseN) && baseN > 0 ? baseN : null;
        ipca_indice_ref = Number.isFinite(refN) && refN > 0 ? refN : null;

        if (!ipca_indice_base || !ipca_indice_ref) {
          const faltando: string[] = [];
          if (!ipca_indice_base) faltando.push(`base ${mesBase.slice(0, 7)}`);
          if (!ipca_indice_ref) faltando.push(`ref ${mesRef.slice(0, 7)}`);
          ipca_msg = `IPCA não aplicado: índice não cadastrado (${faltando.join(", ")}).`;
        } else {
          const fator = ipca_indice_ref / ipca_indice_base;

          if (!Number.isFinite(fator) || fator <= 0) {
            ipca_msg = "IPCA não aplicado: fator inválido.";
          } else {
            ipca_aplicado = true;
            ipca_fator = fator;

            lucro_diario_hist_ipca = lucroDiarioHist * fator;

            const metaDiaIpca = lucro_diario_hist_ipca / lucroUnitarioComAdicional;
            const metaTotIpca = metaDiaIpca * diasPromo;

            meta_unid_dia_ipca = Math.ceil(metaDiaIpca);
            meta_unid_total_ipca = Math.ceil(metaTotIpca);

            ipca_msg = `IPCA aplicado (${mesBase.slice(0, 7)} → ${mesRef.slice(0, 7)}).`;
          }
        }
      } catch {
        ipca_msg = "IPCA não aplicado: erro ao consultar índices (ipca_mensal).";
      }
    }


    const entrada = {
      produto_nome: produto,
      categoria: categoria || "",
      comprador: compradorAuto,
      marca: marca || "",
      tipo_promocao: tipoPromocao,
      data_inicio_promocao: typeof dataInicio === "string" ? dataInicio : "",
      data_fim_promocao: typeof dataFim === "string" ? dataFim : "",
      data_base_historico: mesBase || "",
      ipca_aplicado,
      ipca_msg,
      ipca_mes_base,
      ipca_mes_ref,
      ipca_indice_base,
      ipca_indice_ref,
      ipca_fator,
      lucro_diario_hist_ipca,

      A,
      B,
      C: String(diasPromo),
      D,
      E,
      F,
      lucro_diario_hist: lucroDiarioHist,
    };

    const metas = {
      meta_unid_dia: Math.ceil(metaUnidDia),
      meta_unid_total: Math.ceil(metaUnidTotal),

      lucro_unitario_sem_adicional: lucroUnitarioSemAdicional,
      lucro_unitario_com_adicional: lucroUnitarioComAdicional,

      lucro_unitario_promo: lucroUnitarioComAdicional,

      markup_com_adicional: markupComAdicional,
      meta_unid_dia_ipca,
      meta_unid_total_ipca,
    };


    const resultado = { entrada, metas };

    await db("historico").insert({
      resultado,
      produto_nome_txt: produto,
      categoria_txt: categoria || null,
      comprador_txt: compradorAuto,
      marca_txt: marca || null,
      data_inicio_promocao: dataInicio || null,
      data_fim_promocao: dataFim || null,
      tipo_promocao_txt: tipoPromocao,
      created_by: user.uid,
    });


    return NextResponse.json(resultado);
  } catch (err) {
    console.error("ERRO /api/calculo:", err);
    return NextResponse.json(
      { error: "Erro ao processar o cálculo. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
