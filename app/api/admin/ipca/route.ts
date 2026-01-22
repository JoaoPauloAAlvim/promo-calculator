import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { requireOwner } from "@/lib/authGuard";
import { toNumberBR } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeMonthStart(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s.slice(0, 7)}-01`;
  if (/^\d{2}\/\d{4}$/.test(s)) {
    const [mm, yyyy] = s.split("/");
    return `${yyyy}-${mm}-01`;
  }
  return null;
}

export async function GET() {
  const denied = requireOwner();
  if (denied) return denied;

  const rows = await db("ipca_mensal")
    .select("mes", "indice")
    .orderBy("mes", "desc")
    .limit(240);

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const denied = requireOwner();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "Nenhum item enviado." }, { status: 400 });

  let upserted = 0;

  await db.transaction(async (trx) => {
    for (const it of items) {
      const mes = normalizeMonthStart(it?.mes);
      const indiceRaw = it?.indice;

      const indice =
        typeof indiceRaw === "number"
          ? indiceRaw
          : typeof indiceRaw === "string"
          ? toNumberBR(indiceRaw)
          : NaN;

      if (!mes || !Number.isFinite(indice) || indice <= 0) continue;

      await trx("ipca_mensal")
        .insert({ mes, indice, updated_at: trx.fn.now() })
        .onConflict("mes")
        .merge({ indice, updated_at: trx.fn.now() });

      upserted++;
    }
  });

  if (!upserted) {
    return NextResponse.json(
      { error: "Nenhuma linha válida. Use mes (YYYY-MM) e indice (>0)." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, upserted });
}
