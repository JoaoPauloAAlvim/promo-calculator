import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const produto = searchParams.get("produto")?.trim();
    const marca = searchParams.get("marca")?.trim();
    const categoria = searchParams.get("categoria")?.trim();
    const comprador = searchParams.get("comprador")?.trim();

    const query = db("historico")
      .select("id", "dataHora", "resultado")
      .orderBy("dataHora", "desc")
      .limit(200);

    // filtro por produto (nome)
    if (produto) {
      const like = `%${produto.toLowerCase()}%`;
      query.whereRaw(
        `(
          lower(resultado->'entrada'->>'produto_nome') like ?
          OR lower(resultado->'entrada'->>'produto') like ?
        )`,
        [like, like]
      );
    }

    // filtro por marca (igual exato da opção)
    if (marca) {
      query.whereRaw(
        "resultado->'entrada'->>'marca' = ?",
        [marca]
      );
    }

    // filtro por categoria
    if (categoria) {
      query.whereRaw(
        "resultado->'entrada'->>'categoria' = ?",
        [categoria]
      );
    }

    // filtro por comprador
    if (comprador) {
      query.whereRaw(
        "resultado->'entrada'->>'comprador' = ?",
        [comprador]
      );
    }

    const rows = await query;

    const itens = rows.map((row: any) => ({
      id: row.id,
      dataHora: row.dataHora,
      resultado:
        typeof row.resultado === "string"
          ? JSON.parse(row.resultado)
          : row.resultado,
    }));

    return NextResponse.json({ itens });
  } catch (err: any) {
    console.error("ERRO /api/historico GET:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao carregar histórico." },
      { status: 500 }
    );
  }
}


// DELETE permanece igual ao que já fizemos
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido para exclusão." },
        { status: 400 }
      );
    }

    const apagados = await db("historico").where({ id }).del();

    if (!apagados) {
      return NextResponse.json(
        { error: "Registro não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("ERRO /api/historico DELETE:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao excluir registro." },
      { status: 500 }
    );
  }
}
