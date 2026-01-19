import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { requireOwner } from "@/lib/authGuard";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireOwner();
  if (denied) return denied;

  const rows = await db("users")
    .select("id", "email", "nome", "role", "is_active", "created_at", "updated_at")
    .orderBy("id", "asc");

  return NextResponse.json({ users: rows });
}

export async function POST(req: Request) {
  const denied = requireOwner();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const email = String(body.email || "").trim().toLowerCase();
  const nome = String(body.nome || "").trim();
  const senha = String(body.senha || "").trim();
  const role = String(body.role || "USER").trim().toUpperCase();

  if (!email || !email.includes("@")) return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  if (!nome) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  if (!senha || senha.length < 6) return NextResponse.json({ error: "Senha muito curta (mínimo 6)." }, { status: 400 });
  if (role !== "USER") return NextResponse.json({ error: "Role inválida (apenas USER)." }, { status: 400 });

  const exists = await db("users").where({ email }).first();
  if (exists) return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });

  const { saltB64, hashB64 } = hashPassword(senha);

  const [idRow] = await db("users")
    .insert({
      email,
      nome,
      role,
      password_salt: saltB64,
      password_hash: hashB64,
      is_active: true,
    })
    .returning("id");

  const id = typeof idRow === "object" ? (idRow.id ?? idRow) : idRow;

  return NextResponse.json({ ok: true, id });
}
