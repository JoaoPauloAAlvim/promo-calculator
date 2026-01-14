import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/authToken";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim();
    const senha = (body.senha || "").trim();
    const lembrar = Boolean(body.lembrar);

    const allowedEmail = process.env.AUTH_EMAIL?.trim();
    const allowedPassword = process.env.AUTH_PASSWORD?.trim();

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
