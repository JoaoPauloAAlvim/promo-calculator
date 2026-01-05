"use client";

import { useState } from "react";

type UseLoginArgs = {
  onSuccess: () => void;
};

export function useLogin({ onSuccess }: UseLoginArgs) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
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

      onSuccess();
    } catch (err) {
      console.error(err);
      setErro("Erro inesperado ao tentar fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function fecharErro() {
    setErro(null);
  }

  return {
    email,
    setEmail,
    senha,
    setSenha,
    lembrar,
    setLembrar,
    loading,
    erro,
    handleLogin,
    fecharErro,
  };
}
