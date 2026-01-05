import { api } from "./client";

export type LoginPayload = {
  email: string;
  senha: string;
  lembrar: boolean;
};

export async function login(body: { email: string; senha: string; lembrar: boolean }) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "Usuário ou senha inválidos.");
  }

  return data;
}

export async function logout() {
  return api<{ ok?: boolean } | any>("/api/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
