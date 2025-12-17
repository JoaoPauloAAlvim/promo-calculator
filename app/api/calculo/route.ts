// app/api/calculo/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // desestrutura com defaults seguros
    let {
      produto,
      categoria,
      comprador,
      marca,
      A,
      B,
      C,
      D,
      E,
      F,
    } = body ?? {};

    // normalizar textos
    produto = typeof produto === "string" ? produto.trim() : "";
    categoria = typeof categoria === "string" ? categoria.trim() : "";
    comprador = typeof comprador === "string" ? comprador.trim() : "";
    marca = typeof marca === "string" ? marca.trim() : "";

    // validação básica de produto
    if (!produto) {
      return NextResponse.json(
        { error: "Informe o nome do produto." },
        { status: 400 }
      );
    }

    // ajuda a evitar textos absurdos gravados
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
    if (!Number.isFinite(periodoHistorico)) camposInvalidos.push("Período histórico (A)");
    if (!Number.isFinite(lucroTotalHistorico)) camposInvalidos.push("Lucro total histórico (B)");
    if (!Number.isFinite(diasPromo)) camposInvalidos.push("Duração da promoção (C)");
    if (!Number.isFinite(precoPromo)) camposInvalidos.push("Preço promocional (D)");
    if (!Number.isFinite(custoUnit)) camposInvalidos.push("Custo unitário (E)");
    if (!Number.isFinite(receitaAdicional)) camposInvalidos.push("Receita adicional (F)");

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

    // regras de negócio / faixas mínimas
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

    // aqui assumimos reembolso/receita adicional como >= 0
    if (receitaAdicional < 0) {
      return NextResponse.json(
        {
          error:
            "A receita adicional/reembolso (F) não pode ser negativa. Se for desconto de custo, ajuste o custo unitário.",
        },
        { status: 400 }
      );
    }

    // --- CÁLCULOS ---
    const lucroDiarioHist = lucroTotalHistorico / periodoHistorico;

    // lucro unitário da promoção = preço promocional + reembolso - custo
    const lucroUnitarioPromo = precoPromo + receitaAdicional - custoUnit;

    // se lucro unitário <= 0, a promoção não faz sentido
    if (!Number.isFinite(lucroUnitarioPromo) || lucroUnitarioPromo <= 0) {
      return NextResponse.json(
        {
          error:
            "O lucro unitário na promoção está zerado ou negativo. Ajuste preço, custo ou reembolso para que a promoção tenha lucro por unidade.",
        },
        { status: 400 }
      );
    }

    const metaUnidDia = lucroDiarioHist / lucroUnitarioPromo;
    const metaUnidTotal = metaUnidDia * diasPromo;

    const entrada = {
      produto_nome: produto,
      categoria: categoria || "",
      comprador: comprador || "",
      marca: marca || "",
      A: periodoHistorico,
      B: lucroTotalHistorico,
      C: diasPromo,
      D: precoPromo,
      E: custoUnit,
      F: receitaAdicional,
      lucro_diario_hist: lucroDiarioHist,
    };

    const metas = {
      meta_unid_dia: Math.ceil(metaUnidDia),
      meta_unid_total: Math.ceil(metaUnidTotal),
      lucro_unitario_promo: lucroUnitarioPromo,
    };

    const resultado = { entrada, metas };

    // grava no histórico
    await db("historico").insert({
      resultado: JSON.stringify(resultado),
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
