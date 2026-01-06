import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
export const runtime = "nodejs";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const produto = searchParams.get("produto")?.trim();
    const marca = searchParams.get("marca")?.trim();
    const categoria = searchParams.get("categoria")?.trim();
    const comprador = searchParams.get("comprador")?.trim();

    const statusPromo = searchParams.get("statusPromo")?.trim().toUpperCase();
    const statusAnalise = searchParams.get("statusAnalise")?.trim().toUpperCase();

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "20", 10) || 20, 1),
      100
    );

    const sort = (searchParams.get("sort") || "RECENTE").trim().toUpperCase();

    const hojeBR = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());

    const baseQuery = db("historico");


    if (produto) {
      const like = `%${produto.toLowerCase()}%`;
      baseQuery.whereRaw(
        `(
          lower(resultado->'entrada'->>'produto_nome') like ?
          OR lower(resultado->'entrada'->>'produto') like ?
        )`,
        [like, like]
      );
    }

    if (marca) {
      baseQuery.whereRaw("resultado->'entrada'->>'marca' = ?", [marca]);
    }

    if (categoria) {
      baseQuery.whereRaw("resultado->'entrada'->>'categoria' = ?", [categoria]);
    }

    if (comprador) {
      baseQuery.whereRaw("resultado->'entrada'->>'comprador' = ?", [comprador]);
    }


    if (statusPromo) {
      const inicioExpr = `resultado->'entrada'->>'data_inicio_promocao'`;
      const fimExpr = `resultado->'entrada'->>'data_fim_promocao'`;
      const inicioVal = `coalesce(${inicioExpr}, '')`;
      const fimVal = `coalesce(${fimExpr}, '')`;

      if (statusPromo === "SEM_DATAS") {
        baseQuery.whereRaw(`(${inicioVal} = '' OR ${fimVal} = '')`);
      } else if (statusPromo === "NAO_INICIOU") {
        baseQuery.whereRaw(
          `(${inicioVal} <> '' AND ${fimVal} <> '' AND ${inicioExpr} > ?)`,
          [hojeBR]
        );
      } else if (statusPromo === "ENCERRADA") {
        baseQuery.whereRaw(
          `(${inicioVal} <> '' AND ${fimVal} <> '' AND ${fimExpr} < ?)`,
          [hojeBR]
        );
      } else if (statusPromo === "EM_ANDAMENTO") {
        baseQuery.whereRaw(
          `(${inicioVal} <> '' AND ${fimVal} <> '' AND ${inicioExpr} <= ? AND ${fimExpr} >= ?)`,
          [hojeBR, hojeBR]
        );
      }
    }

    if (statusAnalise) {
      const sitExpr = `coalesce(resultado->'metas'->'venda_real'->>'situacao', '')`;

      if (statusAnalise === "PENDENTE") {
        baseQuery.whereRaw(`${sitExpr} = ''`);
      } else if (["ACIMA", "ABAIXO", "IGUAL"].includes(statusAnalise)) {
        baseQuery.whereRaw(`upper(${sitExpr}) = ?`, [statusAnalise]);
      }
    }

    const countRow = await baseQuery
      .clone()
      .count<{ total: string | number }>({ total: "*" })
      .first();

    const totalCount = countRow
      ? typeof countRow.total === "string"
        ? parseInt(countRow.total, 10) || 0
        : Number(countRow.total) || 0
      : 0;

    const offset = (page - 1) * pageSize;

    const inicioExpr = `resultado->'entrada'->>'data_inicio_promocao'`;
    const fimExpr = `resultado->'entrada'->>'data_fim_promocao'`;
    const inicioVal = `coalesce(${inicioExpr}, '')`;
    const fimVal = `coalesce(${fimExpr}, '')`;

    const sitExpr = `coalesce(resultado->'metas'->'venda_real'->>'situacao', '')`;

    const produtoExpr = `
  lower(coalesce(
    resultado->'entrada'->>'produto_nome',
    resultado->'entrada'->>'produto',
    ''
  ))
`;

    const isEmAndamentoExpr = `
  CASE
    WHEN (${inicioVal} <> '' AND ${fimVal} <> '' AND ${inicioExpr} <= ? AND ${fimExpr} >= ?)
    THEN 1 ELSE 0
  END
`;

    const isPendenteExpr = `
  CASE
    WHEN (${sitExpr} = '') THEN 1 ELSE 0
  END
`;

    const q = baseQuery.clone().select("id", "dataHora", "resultado");

    if (sort === "ANTIGO") {
      q.orderBy("dataHora", "asc");
    } else if (sort === "PRODUTO_AZ") {
      q.orderByRaw(`${produtoExpr} asc nulls last`);
      q.orderBy("dataHora", "desc");
    } else if (sort === "PROMO_EM_ANDAMENTO") {
      q.orderByRaw(`${isEmAndamentoExpr} desc`, [hojeBR, hojeBR]);
      q.orderBy("dataHora", "desc");
    } else if (sort === "ANALISE_PENDENTE") {
      q.orderByRaw(`${isPendenteExpr} desc`);
      q.orderBy("dataHora", "desc");
    } else {
      q.orderBy("dataHora", "desc");
    }

    const rows = await q.offset(offset).limit(pageSize + 1);


    const hasMore = rows.length > pageSize;
    const sliced = hasMore ? rows.slice(0, pageSize) : rows;

    const itens = sliced.map((row: any) => ({
      id: row.id,
      dataHora: row.dataHora,
      resultado: typeof row.resultado === "string" ? JSON.parse(row.resultado) : row.resultado,
    }));

    return NextResponse.json({
      itens,
      page,
      pageSize,
      hasMore,
      totalCount,
    });
  } catch (err: any) {
    console.error("ERRO /api/historico GET:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao carregar histórico." },
      { status: 500 }
    );
  }
}



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
