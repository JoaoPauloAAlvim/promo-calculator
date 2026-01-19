import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAuthToken, type TokenPayload } from "@/lib/authToken";

export function getAuthUser(): TokenPayload | null {
  const token = cookies().get("simulador_auth")?.value;
  return verifyAuthToken(token);
}

export function requireAuth() {
  const payload = getAuthUser();
  if (!payload) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  return null;
}

export function requireOwner() {
  const payload = getAuthUser();
  if (!payload) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (payload.role !== "OWNER") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  return null;
}
