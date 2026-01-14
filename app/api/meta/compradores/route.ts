import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { requireAuth } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAuth();
  if (denied) return denied;

  try {
    const rows = await db("historico")
      .select(db.raw("DISTINCT UPPER(TRIM(comprador_txt)) as v"))
      .whereNotNull("comprador_txt")
      .whereRaw("trim(comprador_txt) <> ''")
      .orderBy("v", "asc");

    const compradores = rows.map((r: any) => String(r.v)).filter(Boolean);
    
    return NextResponse.json({ compradores });
  } catch (err: any) {
    console.error("ERRO /api/meta/compradores:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao carregar compradores." },
      { status: 500 }
    );
  }
}
