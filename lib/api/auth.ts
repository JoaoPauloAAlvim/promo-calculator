import { api } from "./client";

export async function login(payload: { email: string; senha: string; lembrar: boolean }) {
  return api<{ ok: true }>("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return api<{ ok: true }>("/api/logout", { method: "POST" });
}
