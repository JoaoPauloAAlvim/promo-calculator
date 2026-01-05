"use client";

import { Spinner } from "../Spinner";

type Props = {
  email: string;
  setEmail: (v: string) => void;
  senha: string;
  setSenha: (v: string) => void;
  lembrar: boolean;
  setLembrar: (v: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function LoginForm({
  email,
  setEmail,
  senha,
  setSenha,
  lembrar,
  setLembrar,
  loading,
  onSubmit,
}: Props) {
  return (
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

        <form onSubmit={onSubmit}>
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
  );
}
