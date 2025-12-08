// app/api/calculo/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { produto, A, B, C, D, E, F } = body;

    // validação básica
    if (
      !produto ||
      [A, B, C, D, E, F].some(
        (v) => v === undefined || v === null || Number.isNaN(Number(v))
      )
    ) {
      return NextResponse.json(
        { error: "Dados insuficientes ou inválidos para calcular." },
        { status: 400 }
      );
    }

    const periodoHistorico = Number(A);
    const lucroTotalHistorico = Number(B);
    const diasPromo = Number(C);
    const precoPromo = Number(D);
    const custoUnit = Number(E);
    const receitaAdicional = Number(F); // reembolso / sell-out

    if (periodoHistorico <= 0 || diasPromo <= 0) {
      return NextResponse.json(
        { error: "Período histórico e duração da promoção devem ser > 0." },
        { status: 400 }
      );
    }

    // --- CÁLCULO EXEMPLO (ajuste se sua lógica for outra) ---
    const lucroDiarioHist = lucroTotalHistorico / periodoHistorico;
    const lucroUnitPromo = precoPromo - custoUnit + receitaAdicional;
    const metaUnidDia = lucroDiarioHist / (lucroUnitPromo || 1);
    const metaUnidTotal = metaUnidDia * diasPromo;

    const situacao =
      lucroUnitPromo > lucroDiarioHist
        ? "ACIMA"
        : lucroUnitPromo < lucroDiarioHist
        ? "ABAIXO"
        : "IGUAL";

    const entrada = {
      produto_nome: produto,
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
      situacao,
    };

    const resultado = { entrada, metas };

    // --- AQUI É O PONTO QUE FALTAVA: INSERIR NO HISTÓRICO ---
    await db("historico").insert({
      // "dataHora" usa DEFAULT NOW() da tabela, não precisa mandar
      resultado: JSON.stringify(resultado),
    });

    return NextResponse.json(resultado);
  } catch (err) {
    console.error("ERRO /api/calculo:", err);
    return NextResponse.json(
      { error: "Erro ao processar o cálculo." },
      { status: 500 }
    );
  }
}
