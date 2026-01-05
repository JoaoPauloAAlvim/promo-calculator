"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "../components/AppHeader";

import { useLogin } from "@/app/hooks/useLogin";
import { LoginForm } from "../components/login/LoginForm";
import { LoginErrorModal } from "../components/login/LoginErrorModal";

export default function LoginPage() {
  const router = useRouter();

  const login = useLogin({
    onSuccess: () => router.push("/"),
  });

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
            Acesso restrito – faça login para entrar
          </span>
        }
      />

      <LoginForm
        email={login.email}
        setEmail={login.setEmail}
        senha={login.senha}
        setSenha={login.setSenha}
        lembrar={login.lembrar}
        setLembrar={login.setLembrar}
        loading={login.loading}
        onSubmit={login.handleLogin}
      />

      <LoginErrorModal erro={login.erro} onClose={login.fecharErro} />
    </div>
  );
}
