import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { requireOwner } from "@/lib/authGuard";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = requireOwner();
  if (denied) return denied;

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const patch: any = { updated_at: db.fn.now() };

  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  if (body.senha) {
    const senha = String(body.senha || "").trim();
    if (senha.length < 6) return NextResponse.json({ error: "Senha muito curta (mínimo 6)." }, { status: 400 });
    const { saltB64, hashB64 } = hashPassword(senha);
    patch.password_salt = saltB64;
    patch.password_hash = hashB64;
  }

  await db("users").where({ id }).update(patch);

  return NextResponse.json({ ok: true });
}
