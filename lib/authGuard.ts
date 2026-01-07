import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function requireAuth() {
  const c = cookies().get("simulador_auth")?.value;

  if (c !== "ok") {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  return null;
}
