// app/api/login/route.ts
import { NextResponse } from "next/server";

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

    // cookie de sessão (somente indica que está logado, mesmo histórico pra todos)
    res.cookies.set("simulador_auth", "ok", {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "lax",
      maxAge: lembrar ? 60 * 60 * 24 * 30 : 60 * 60 * 1, // 30 dias ou 1 hora
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
