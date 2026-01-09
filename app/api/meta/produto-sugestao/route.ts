import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { requireAuth } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAuth();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const produto = (searchParams.get("produto") || "").trim();

    if (!produto || produto.length < 3) {
      return NextResponse.json({ sugestao: null, candidatos: [] });
    }

    const like = `%${produto.toLowerCase()}%`;

    const rows = await db("historico")
      .select("produto_nome_txt", "marca_txt", "categoria_txt", "dataHora")
      .whereRaw("lower(coalesce(produto_nome_txt,'')) like ?", [like])
      .orderBy("dataHora", "desc")
      .limit(20);

    if (!rows.length) {
      return NextResponse.json({ sugestao: null, candidatos: [] });
    }

    const prodLower = produto.toLowerCase();

    let best =
      rows.find((r: any) => String(r.produto_nome_txt || "").toLowerCase() === prodLower) ||
      rows.find((r: any) => String(r.produto_nome_txt || "").toLowerCase().startsWith(prodLower)) ||
      rows[0];

    const sugestao =
      best && (best.marca_txt || best.categoria_txt)
        ? {
            produto: String(best.produto_nome_txt || ""),
            marca: String(best.marca_txt || ""),
            categoria: String(best.categoria_txt || ""),
          }
        : null;

    const seen = new Set<string>();
    const candidatos = rows
      .map((r: any) => ({
        produto: String(r.produto_nome_txt || ""),
        marca: String(r.marca_txt || ""),
        categoria: String(r.categoria_txt || ""),
      }))
      .filter((c) => {
        const k = `${c.produto}||${c.marca}||${c.categoria}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    return NextResponse.json({ sugestao, candidatos });
  } catch (err: any) {
    console.error("ERRO /api/meta/produto-sugestao:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao sugerir marca/categoria." },
      { status: 500 }
    );
  }
}
