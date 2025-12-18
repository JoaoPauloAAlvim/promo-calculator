// app/api/historico/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido para atualização." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const qtdVendida = Number(body.qtdVendida);
    const lucroHistPeriodo = Number(body.lucroHistPeriodo);
    const lucroRealPromo = Number(body.lucroRealPromo);
    const diff = Number(body.diff);
    const situacao = String(body.situacao || "").toUpperCase();

    if (!qtdVendida || Number.isNaN(qtdVendida) || qtdVendida <= 0) {
      return NextResponse.json(
        { error: "Quantidade vendida inválida." },
        { status: 400 }
      );
    }

    if (!["ACIMA", "ABAIXO", "IGUAL"].includes(situacao)) {
      return NextResponse.json(
        { error: "Situação inválida." },
        { status: 400 }
      );
    }

    // busca o registro atual
    const row = await db("historico")
      .select("resultado")
      .where({ id })
      .first();

    if (!row) {
      return NextResponse.json(
        { error: "Registro de histórico não encontrado." },
        { status: 404 }
      );
    }

    const atual =
      typeof row.resultado === "string"
        ? JSON.parse(row.resultado)
        : row.resultado || {};

    const novoResultado = {
      ...atual,
      metas: {
        ...(atual.metas || {}),
        venda_real: {
          qtd_vendida: qtdVendida,
          lucro_hist_periodo: lucroHistPeriodo,
          lucro_real_promo: lucroRealPromo,
          diff,
          situacao,
        },
      },
    };

    await db("historico")
      .where({ id })
      .update({ resultado: JSON.stringify(novoResultado) });

    return NextResponse.json({ ok: true, resultado: novoResultado });
  } catch (err: any) {
    console.error("ERRO PATCH /api/historico/:id:", err);
    return NextResponse.json(
      { error: "Erro ao salvar análise da promoção." },
      { status: 500 }
    );
  }
}
