import { NextResponse } from "next/server";
import { db } from "@/lib/knex";

export async function GET() {
  try {
    const r = await db.raw("SELECT NOW()");
    return NextResponse.json({ ok: true, time: r.rows[0].now });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
