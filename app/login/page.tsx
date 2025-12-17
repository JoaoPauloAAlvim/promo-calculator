"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Spinner = ({ size = 24 }: { size?: number }) => (
  <span
    className="
      inline-block animate-spin rounded-full
      border-4 border-slate-300 border-t-indigo-500
    "
    style={{ width: size, height: size }}
  />
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha.trim()) {
      setErro("Informe e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, lembrar }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.error || "Usuário ou senha inválidos.");
        return;
      }

      // sucesso → leva sempre para a home do simulador
      router.push("/");
    } catch (e) {
      console.error(e);
      setErro("Erro inesperado ao tentar fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* TOPO */}
      <header
        style={{
          backgroundColor: "#e5e7eb",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Simulador de Promoções – Login
        </h1>

        {/* apenas um texto informativo, sem atalho pra / */}
        <span
          style={{
            fontSize: "11px",
            color: "#6b7280",
          }}
        >
          Acesso restrito – faça login para entrar
        </span>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <section
          className="bg-white shadow-md p-6 md:p-7"
          style={{
            width: "100%",
            maxWidth: "380px",
            borderRadius: "18px",
            borderWidth: "3px",
            borderStyle: "solid",
            borderColor: "#9ca3af",
            boxSizing: "border-box",
          }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2 text-center">
            Acessar simulador
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mb-4 text-center">
            Use o e-mail e senha cadastrados para entrar.
          </p>

          {erro && (
            <div className="mb-4 rounded-xl border border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700">
              ⚠ {erro}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: compras@levate.com.br"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                  }}
                />
                Manter conectado
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "8px 0",
                borderRadius: "10px",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.8 : 1,
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <Spinner size={18} />
                  <span>Entrando…</span>
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
