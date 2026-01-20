import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/authToken";

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

    const allowedEmail = process.env.AUTH_EMAIL?.trim();
    const allowedPassword = process.env.AUTH_PASSWORD?.trim();

    const key = getClientKey(req, email);

    const rl = checkRateLimit(key, 10, 10 * 60 * 1000);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        }
      );
    }


    if (!allowedEmail || !allowedPassword) {
      return NextResponse.json(
        {
          error:
            "Configuração de login não encontrada no servidor. Defina AUTH_EMAIL e AUTH_PASSWORD nas variáveis de ambiente.",
        },
        { status: 500 }
      );
    }

    if (email !== allowedEmail || senha !== allowedPassword) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });

    const maxAge = lembrar ? 60 * 60 * 24 * 7 : 60 * 60 * 1;
    const token = createAuthToken(maxAge);

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
