"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "../AppHeader";
import { useLogin } from "@/app/hooks/useLogin";
import { LoginForm } from "./LoginForm";
import { LoginErrorModal } from "./LoginErrorModal";
import { useEffect, useState } from "react";
import { ActionModal } from "../ui/ActionModal";

export default function LoginPage() {
    const sp = useSearchParams();
    const router = useRouter();

    const [sessionModalOpen, setSessionModalOpen] = useState(() => {
        try {
            if (sessionStorage.getItem("simulador_session_expired") === "1") return true;

            const had = localStorage.getItem("simulador_had_session") === "1";
            const from = (sp.get("from") || "").trim();
            const alreadyShown = sessionStorage.getItem("simulador_expired_shown") === "1";

            const shouldShowByFrom = from !== "" && from !== "/" && from !== "/login";

            if (had && shouldShowByFrom && !alreadyShown) return true;

            return false;
        } catch {
            return false;
        }
    });



    useEffect(() => {
        if (sp.get("reason") === "expired") {
            setSessionModalOpen(true);
        }
    }, [sp]);

    useEffect(() => {
        if (!sessionModalOpen) return;

        try {
            sessionStorage.removeItem("simulador_session_expired");
            sessionStorage.setItem("simulador_expired_shown", "1");
        } catch { }

        const from = sp.get("from");
        const url = from ? `/login?from=${encodeURIComponent(from)}` : "/login";
        router.replace(url);
    }, [sessionModalOpen, sp, router]);



    useEffect(() => {
        if (!sessionModalOpen) return;
        try {
            sessionStorage.removeItem("simulador_session_expired");
        } catch { }
    }, [sessionModalOpen]);


    const login = useLogin({
        onSuccess: () => {
            try {
                localStorage.setItem("simulador_had_session", "1");
                sessionStorage.removeItem("simulador_expired_shown");
            } catch { }

            const from = sp.get("from");
            router.replace(from || "/");
        },
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
            <ActionModal
                open={sessionModalOpen}
                title="Sessão expirada"
                message="Sua sessão foi encerrada. Faça login novamente para continuar."
                variant="info"
                onClose={() => setSessionModalOpen(false)}
            />


            <LoginErrorModal erro={login.erro} onClose={login.fecharErro} />
        </div>
    );
}
