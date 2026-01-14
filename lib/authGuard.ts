import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/authToken";

export function requireAuth() {
  const token = cookies().get("simulador_auth")?.value;

  if (!verifyAuthToken(token)) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  return null;
}
