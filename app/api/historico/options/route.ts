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
        q.where("produto_nome_txt", "ilike", `%${produto}%`);
      }

      if (statusPromo) {
        if (statusPromo === "SEM_DATAS") {
          q.where((qq: any) =>
            qq.whereNull("data_inicio_promocao").orWhereNull("data_fim_promocao")
          );
        } else if (statusPromo === "NAO_INICIOU") {
          q.whereNotNull("data_inicio_promocao")
            .whereNotNull("data_fim_promocao")
            .where("data_inicio_promocao", ">", hojeBR);
        } else if (statusPromo === "ENCERRADA") {
          q.whereNotNull("data_inicio_promocao")
            .whereNotNull("data_fim_promocao")
            .where("data_fim_promocao", "<", hojeBR);
        } else if (statusPromo === "EM_ANDAMENTO") {
          q.whereNotNull("data_inicio_promocao")
            .whereNotNull("data_fim_promocao")
            .where("data_inicio_promocao", "<=", hojeBR)
            .where("data_fim_promocao", ">=", hojeBR);
        }
      }

      if (statusAnalise) {
        if (statusAnalise === "PENDENTE") {
          q.where((qq: any) => qq.whereNull("situacao_analise").orWhere("situacao_analise", ""));
        } else if (["ACIMA", "ABAIXO", "IGUAL"].includes(statusAnalise)) {
          q.where("situacao_analise", statusAnalise);
        }
      }
    };

    const buildMarcas = async () => {
      const q = db("historico");
      applyCommonFilters(q);

      if (categoria) q.where("categoria_txt", categoria);
      if (comprador) q.where("comprador_txt", comprador);

      const rows = await q
        .clone()
        .distinct(db.raw(`marca_txt as v`))
        .whereNotNull("marca_txt")
        .where("marca_txt", "<>", "")
        .orderBy("v", "asc");

      return rows.map((r: any) => r.v).filter(Boolean);
    };

    const buildCategorias = async () => {
      const q = db("historico");
      applyCommonFilters(q);

      if (marca) q.where("marca_txt", marca);
      if (comprador) q.where("comprador_txt", comprador);

      const rows = await q
        .clone()
        .distinct(db.raw(`categoria_txt as v`))
        .whereNotNull("categoria_txt")
        .where("categoria_txt", "<>", "")
        .orderBy("v", "asc");

      return rows.map((r: any) => r.v).filter(Boolean);
    };

    const buildCompradores = async () => {
      const q = db("historico");
      applyCommonFilters(q);

      if (marca) q.where("marca_txt", marca);
      if (categoria) q.where("categoria_txt", categoria);

      const rows = await q
        .clone()
        .distinct(db.raw(`comprador_txt as v`))
        .whereNotNull("comprador_txt")
        .where("comprador_txt", "<>", "")
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
