"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "../components/Spinner";
import { AppHeader } from "../components/AppHeader";

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

      router.push("/");
    } catch (e) {
      console.error(e);
      setErro("Erro inesperado ao tentar fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function fecharModalErro() {
    setErro(null);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader
        title="Simulador de Promoções – Login"
        rightSlot={
          <span
            style={{
              fontSize: "11px",
              color: "#6b7280",
            }}
          >
            Acesso restrito – Faça login para entrar
          </span>
        }
      />

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
                placeholder="Digite seu email"
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

      {/* MODAL DE ERRO */}
      {erro && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
            zIndex: 60,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              maxWidth: "420px",
              width: "100%",
              padding: "18px 20px 16px",
              border: "1px solid #fecaca",
              boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
              position: "relative",
            }}
          >
            <button
              onClick={fecharModalErro}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                borderRadius: "999px",
                border: "none",
                padding: "3px 7px",
                fontSize: "11px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  backgroundColor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  color: "#b91c1c",
                  flexShrink: 0,
                }}
              >
                !
              </div>
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#991b1b",
                    marginBottom: "4px",
                  }}
                >
                  Não foi possível fazer login
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#4b5563",
                    marginBottom: "10px",
                  }}
                >
                  {erro}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={fecharModalErro}
                    style={{
                      fontSize: "12px",
                      borderRadius: "999px",
                      border: "none",
                      padding: "6px 14px",
                      backgroundColor: "#b91c1c",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    OK, entendi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de loading global (opcional – se quiser usar além do spinner do botão) */}
      {false && loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <Spinner size={40} />
          <p
            style={{
              marginTop: "10px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#e5e7eb",
            }}
          >
            Autenticando…
          </p>
        </div>
      )}
    </div>
  );
}
