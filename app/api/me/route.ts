import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { getAuthUser, requireAuth } from "@/lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAuth();
  if (denied) return denied;

  const token = getAuthUser();
  const u = await db("users")
    .select("id", "email", "nome", "role", "is_active")
    .where({ id: token!.uid })
    .first();

  if (!u) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  return NextResponse.json({
    uid: u.id,
    email: u.email,
    nome: u.nome,
    role: u.role,
  });
}
