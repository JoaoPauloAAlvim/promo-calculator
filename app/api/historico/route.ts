import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db("historico")
      .select("id", "dataHora", "resultado")
      .orderBy("dataHora", "desc")
      .limit(100);

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
    console.error("ERRO /api/historico:", err);

    return NextResponse.json(
      {
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
