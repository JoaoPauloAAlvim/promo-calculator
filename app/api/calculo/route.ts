import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { produto, A, B, C, D, E, F } = body;

    const nums = [A, B, C, D, E, F];
    if (nums.some((v) => typeof v !== "number" || Number.isNaN(v))) {
      return NextResponse.json(
        { error: "Todos os campos devem ser números válidos." },
        { status: 400 }
      );
    }

    if (!produto || typeof produto !== "string" || !produto.trim()) {
      return NextResponse.json(
        { error: "Informe o nome do produto." },
        { status: 400 }
      );
    }


    if (A <= 0 || C <= 0) {
      return NextResponse.json(
        { error: "Período histórico e duração da promoção devem ser maiores que zero." },
        { status: 400 }
      );
    }

    const lucro_diario_hist = B / A;
    const lucro_unit_promo = D + F - E;

    if (lucro_unit_promo <= 0) {
      return NextResponse.json(
        {
          erro: "A promoção não gera lucro por unidade.",
          detalhe:
            "O lucro unitário promocional é zero ou negativo. Ajuste preço/custo/verba antes de usar esta estratégia.",
          lucro_unit_promo,
        },
        { status: 200 }
      );
    }

    const meta_unid_dia = Math.ceil(lucro_diario_hist / lucro_unit_promo);
    const meta_unid_total = Math.ceil(meta_unid_dia * C);
    const lucro_total_promo = meta_unid_total * lucro_unit_promo;
    const lucro_med_dia = lucro_total_promo / C;
    const diferenca = lucro_med_dia - lucro_diario_hist;

    let situacao: "ACIMA" | "IGUAL" | "ABAIXO";
    if (lucro_med_dia > lucro_diario_hist) situacao = "ACIMA";
    else if (lucro_med_dia === lucro_diario_hist) situacao = "IGUAL";
    else situacao = "ABAIXO";

    const result = {
      entrada: {
        produto_nome: produto,          // 👈 novo
        periodo_historico_dias: A,
        lucro_total_historico: B,
        lucro_diario_hist,
        duracao_promocao_dias: C,
        preco_promocao: D,
        custo_unitario: E,
        receita_adicional: F,
        lucro_unit_promo,
      },
      metas: {
        meta_unid_dia,
        meta_unid_total,
        lucro_total_promo,
        lucro_med_dia,
        diferenca,
        situacao,
      },
    };


    await db("calculos_promocao").insert({
      produto_nome: produto,           
      periodo_historico_dias: A,
      lucro_total_historico: B,
      duracao_promocao_dias: C,
      preco_promocao: D,
      custo_unitario: E,
      receita_adicional: F,
      resultado_json: result,
    });


    return NextResponse.json(result);
  } catch (e) {
    console.error("Erro na API /calculo:", e);
    return NextResponse.json(
      { error: "Erro interno ao processar o cálculo." },
      { status: 500 }
    );
  }
}
