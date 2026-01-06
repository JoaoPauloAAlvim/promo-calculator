import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
export const runtime = "nodejs";


export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let {
      produto,
      categoria,
      comprador,
      marca,
      dataInicio,
      dataFim,
      A,
      B,
      C,
      D,
      E,
      F,
    } = body;

    produto = typeof produto === "string" ? produto.trim() : "";
    categoria = typeof categoria === "string" ? categoria.trim() : "";
    comprador = typeof comprador === "string" ? comprador.trim() : "";
    marca = typeof marca === "string" ? marca.trim() : "";

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

    const toNumber = (v: any) =>
      typeof v === "number"
        ? v
        : typeof v === "string"
          ? Number(v)
          : NaN;

    const periodoHistorico = toNumber(A);
    const lucroTotalHistorico = toNumber(B);
    const diasPromo = toNumber(C);
    const precoPromo = toNumber(D);
    const custoUnit = toNumber(E);
    const receitaAdicional = toNumber(F);

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

    const entrada = {
      produto_nome: produto,
      categoria: categoria || "",
      comprador: comprador || "",
      marca: marca || "",
      data_inicio_promocao: typeof dataInicio === "string" ? dataInicio : "",
      data_fim_promocao: typeof dataFim === "string" ? dataFim : "",
      A,
      B,
      C,
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
    };


    const resultado = { entrada, metas };

    await db("historico").insert({
  resultado: JSON.stringify(resultado),

  produto_nome_txt: produto,
  marca_txt: marca || "",
  categoria_txt: categoria || "",
  comprador_txt: comprador || "",
  data_inicio_promocao: dataInicio ? String(dataInicio) : null,
  data_fim_promocao: dataFim ? String(dataFim) : null,
  situacao_analise: null,
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
