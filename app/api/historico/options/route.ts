import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s?: string | null) {
  const v = (s ?? "").trim();
  return v.length ? v : "";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const produto = clean(searchParams.get("produto"));
    const marca = clean(searchParams.get("marca"));
    const categoria = clean(searchParams.get("categoria"));
    const comprador = clean(searchParams.get("comprador"));

    const statusPromo = clean(searchParams.get("statusPromo")).toUpperCase();     
    const statusAnalise = clean(searchParams.get("statusAnalise")).toUpperCase(); 

    const hojeBR = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());

    const applyCommonFilters = (q: any) => {
      if (produto) {
        const like = `%${produto.toLowerCase()}%`;
        q.whereRaw(
          `(
            lower(resultado->'entrada'->>'produto_nome') like ?
            OR lower(resultado->'entrada'->>'produto') like ?
          )`,
          [like, like]
        );
      }

      if (statusPromo) {
        const inicioExpr = `resultado->'entrada'->>'data_inicio_promocao'`;
        const fimExpr = `resultado->'entrada'->>'data_fim_promocao'`;
        const inicioVal = `coalesce(${inicioExpr}, '')`;
        const fimVal = `coalesce(${fimExpr}, '')`;

        if (statusPromo === "SEM_DATAS") {
          q.whereRaw(`(${inicioVal} = '' OR ${fimVal} = '')`);
        } else if (statusPromo === "NAO_INICIOU") {
          q.whereRaw(`(${inicioVal} <> '' AND ${fimVal} <> '' AND ${inicioExpr} > ?)`, [hojeBR]);
        } else if (statusPromo === "ENCERRADA") {
          q.whereRaw(`(${inicioVal} <> '' AND ${fimVal} <> '' AND ${fimExpr} < ?)`, [hojeBR]);
        } else if (statusPromo === "EM_ANDAMENTO") {
          q.whereRaw(
            `(${inicioVal} <> '' AND ${fimVal} <> '' AND ${inicioExpr} <= ? AND ${fimExpr} >= ?)`,
            [hojeBR, hojeBR]
          );
        }
      }

      if (statusAnalise) {
        const sitExpr = `coalesce(resultado->'metas'->'venda_real'->>'situacao', '')`;

        if (statusAnalise === "PENDENTE") {
          q.whereRaw(`${sitExpr} = ''`);
        } else if (["ACIMA", "ABAIXO", "IGUAL"].includes(statusAnalise)) {
          q.whereRaw(`upper(${sitExpr}) = ?`, [statusAnalise]);
        }
      }
    };

    const buildMarcas = async () => {
      const q = db("historico");
      applyCommonFilters(q);

      if (categoria) q.whereRaw(`resultado->'entrada'->>'categoria' = ?`, [categoria]);
      if (comprador) q.whereRaw(`resultado->'entrada'->>'comprador' = ?`, [comprador]);

      const rows = await q
        .clone()
        .distinct(db.raw(`resultado->'entrada'->>'marca' as v`))
        .whereRaw(`coalesce(resultado->'entrada'->>'marca','') <> ''`)
        .orderBy("v", "asc");

      return rows.map((r: any) => r.v).filter(Boolean);
    };

    const buildCategorias = async () => {
      const q = db("historico");
      applyCommonFilters(q);

      if (marca) q.whereRaw(`resultado->'entrada'->>'marca' = ?`, [marca]);
      if (comprador) q.whereRaw(`resultado->'entrada'->>'comprador' = ?`, [comprador]);

      const rows = await q
        .clone()
        .distinct(db.raw(`resultado->'entrada'->>'categoria' as v`))
        .whereRaw(`coalesce(resultado->'entrada'->>'categoria','') <> ''`)
        .orderBy("v", "asc");

      return rows.map((r: any) => r.v).filter(Boolean);
    };

    const buildCompradores = async () => {
      const q = db("historico");
      applyCommonFilters(q);

      if (marca) q.whereRaw(`resultado->'entrada'->>'marca' = ?`, [marca]);
      if (categoria) q.whereRaw(`resultado->'entrada'->>'categoria' = ?`, [categoria]);

      const rows = await q
        .clone()
        .distinct(db.raw(`resultado->'entrada'->>'comprador' as v`))
        .whereRaw(`coalesce(resultado->'entrada'->>'comprador','') <> ''`)
        .orderBy("v", "asc");

      return rows.map((r: any) => r.v).filter(Boolean);
    };

    const [marcas, categorias, compradores] = await Promise.all([
      buildMarcas(),
      buildCategorias(),
      buildCompradores(),
    ]);

    return NextResponse.json({ marcas, categorias, compradores, hojeBR });
  } catch (err: any) {
    console.error("ERRO /api/historico/options GET:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao carregar opções." },
      { status: 500 }
    );
  }
}
