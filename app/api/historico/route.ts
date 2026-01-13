import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { requireAuth } from "@/lib/authGuard";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const denied = requireAuth();
    if (denied) return denied;


    const { searchParams } = new URL(req.url);

    const produto = searchParams.get("produto")?.trim();
    const marca = searchParams.get("marca")?.trim();
    const categoria = searchParams.get("categoria")?.trim();
    const comprador = searchParams.get("comprador")?.trim();
    const tipoPromocao = searchParams.get("tipoPromocao")?.trim().toUpperCase();

    const statusPromo = (searchParams.get("statusPromo") ?? "").trim().toUpperCase();
    const statusAnalise = (searchParams.get("statusAnalise") ?? "").trim().toUpperCase();



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
      baseQuery.where("produto_nome_txt", "ilike", `%${produto}%`);
    }


    if (marca) {
      baseQuery.where("marca_txt", marca);
    }

    if (categoria) {
      baseQuery.where("categoria_txt", categoria);
    }

    if (comprador) {
      baseQuery.where("comprador_txt", comprador);
    }

    if (tipoPromocao && ["INTERNA", "SCANNTECH"].includes(tipoPromocao)) {
      baseQuery.where("tipo_promocao_txt", tipoPromocao);
    }



    if (statusPromo) {
      if (statusPromo === "SEM_DATAS") {
        baseQuery.where((q) =>
          q.whereNull("data_inicio_promocao").orWhereNull("data_fim_promocao")
        );
      } else if (statusPromo === "NAO_INICIOU") {
        baseQuery.whereNotNull("data_inicio_promocao")
          .whereNotNull("data_fim_promocao")
          .where("data_inicio_promocao", ">", hojeBR);
      } else if (statusPromo === "ENCERRADA") {
        baseQuery.whereNotNull("data_inicio_promocao")
          .whereNotNull("data_fim_promocao")
          .where("data_fim_promocao", "<", hojeBR);
      } else if (statusPromo === "EM_ANDAMENTO") {
        baseQuery.whereNotNull("data_inicio_promocao")
          .whereNotNull("data_fim_promocao")
          .where("data_inicio_promocao", "<=", hojeBR)
          .where("data_fim_promocao", ">=", hojeBR);
      }
    }

    if (statusAnalise) {
      if (statusAnalise === "PENDENTE") {
        baseQuery.where((q) => q.whereNull("situacao_analise").orWhere("situacao_analise", ""));
      } else if (["ACIMA", "ABAIXO", "IGUAL"].includes(statusAnalise)) {
        baseQuery.where("situacao_analise", statusAnalise);
      }
    }


    const countQuery = baseQuery.clone().count<{ total: string | number }>({ total: "*" }).first();

    const offset = (page - 1) * pageSize;

    const produtoExpr = `lower(coalesce(produto_nome_txt, ''))`;

    const isEmAndamentoExpr = `
  CASE
    WHEN (data_inicio_promocao is not null
      AND data_fim_promocao is not null
      AND data_inicio_promocao <= ?::date
      AND data_fim_promocao >= ?::date)
    THEN 1 ELSE 0
  END
`;


    const isPendenteExpr = `
  CASE
     WHEN (situacao_analise is null OR situacao_analise = '') THEN 1 ELSE 0
  END
`;

    const q = baseQuery
      .clone()
      .select(
        "id",
        "dataHora",
        db.raw(`
      jsonb_build_object(
        'entrada', jsonb_build_object(
  'produto_nome', produto_nome_txt,
  'produto', produto_nome_txt,
  'marca', marca_txt,
  'categoria', categoria_txt,
  'comprador', comprador_txt,
  'tipo_promocao', tipo_promocao_txt,
  'data_inicio_promocao', to_char(data_inicio_promocao, 'YYYY-MM-DD'),
  'data_fim_promocao', to_char(data_fim_promocao, 'YYYY-MM-DD')
),
        'metas', jsonb_build_object(
          'lucro_med_dia', (resultado->'metas'->>'lucro_med_dia')::numeric,
          'lucro_medio_diario_promo', (resultado->'metas'->>'lucro_medio_diario_promo')::numeric,
          'meta_unid_dia', (resultado->'metas'->>'meta_unid_dia')::numeric,
          'meta_unid_total', (resultado->'metas'->>'meta_unid_total')::numeric,
          'venda_real', jsonb_build_object(
            'situacao', resultado->'metas'->'venda_real'->>'situacao'
          )
        )
      ) as resultado
    `)
      );

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

    const rowsQuery = q.offset(offset).limit(pageSize + 1);

    const [countRow, rows] = await Promise.all([countQuery, rowsQuery]);

    const totalCount = countRow
      ? typeof countRow.total === "string"
        ? parseInt(countRow.total, 10) || 0
        : Number(countRow.total) || 0
      : 0;


    const hasMore = rows.length > pageSize;
    const sliced = hasMore ? rows.slice(0, pageSize) : rows;

    const itens = sliced.map((row: any) => ({
      id: row.id,
      dataHora: row.dataHora,
      resultado: row.resultado,
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
    const denied = requireAuth();
    if (denied) return denied;

    const body = await req.json().catch(() => null);

    const ids = Array.isArray(body?.ids) ? body.ids.map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n) && n > 0) : [];

    const id = Number(body?.id);
    if (ids.length === 0 && (!id || Number.isNaN(id))) {
      return NextResponse.json({ error: "ID inválido para exclusão." }, { status: 400 });
    }

    const apagados = ids.length > 0
      ? await db("historico").whereIn("id", ids).del()
      : await db("historico").where({ id }).del();

    if (!apagados) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: apagados });
  } catch (err: any) {
    console.error("ERRO /api/historico DELETE:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao excluir registro." },
      { status: 500 }
    );
  }
}

