import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export async function GET() {
  try {
    const rows = await db("calculos_promocao")
      .select("id", "created_at", "resultado_json")
      .orderBy("created_at", "desc")
      .limit(100);

    const itens = rows.map((row: any) => ({
      id: row.id,
      dataHora: new Date(row.created_at).toISOString(),
      resultado: row.resultado_json,
    }));

    return NextResponse.json({ itens });
  } catch (e) {
    console.error("Erro ao carregar histórico:", e);
    return NextResponse.json(
      { error: "Erro ao carregar histórico." },
      { status: 500 }
    );
  }
}
