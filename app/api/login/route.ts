import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/authToken";
import { db } from "@/lib/knex";
import { verifyPassword, hashPassword } from "@/lib/password";


export const dynamic = "force-dynamic";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function getClientKey(req: Request, email: string) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";

  return `${ip}|${(email || "").toLowerCase()}`;
}

function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  b.count += 1;

  if (b.count > max) {
    const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, retryAfterSec: 0 };
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim();
    const senha = (body.senha || "").trim();
    const lembrar = Boolean(body.lembrar);

    const emailNorm = email.toLowerCase();

    const user = await db("users")
      .select("id", "email", "role", "password_salt", "password_hash", "is_active")
      .where({ email: emailNorm })
      .first();

    if (!user) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Usuário desativado." }, { status: 403 });
    }

    const ok = verifyPassword(senha, user.password_salt, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
    }

    const maxAge = lembrar ? 60 * 60 * 24 * 7 : 60 * 60 * 1;
    const token = createAuthToken({ uid: Number(user.id), role: user.role, maxAgeSeconds: maxAge });

    const res = NextResponse.json({ ok: true });

    res.cookies.set("simulador_auth", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
    });

    return res;

  } catch (error) {
    console.error("ERRO /api/login:", error);
    return NextResponse.json(
      { error: "Erro ao processar login. Tente novamente." },
      { status: 500 }
    );
  }
}
