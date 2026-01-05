"use client";

import { login } from "@/lib/api/auth";
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
      await login({ email, senha, lembrar });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErro(err?.message || "Erro inesperado ao tentar fazer login. Tente novamente.");
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
