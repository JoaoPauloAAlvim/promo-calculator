"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toNumberBR, formatBR } from "@/lib/format";

type Mode = "PRECO" | "REEMBOLSO";

function toBRString(n: number) {
    return Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : "";
}

export default function ReversaPage() {
    const router = useRouter();

    const [modo, setModo] = useState<Mode>("PRECO");

    const [A, setA] = useState("");
    const [B, setB] = useState("");
    const [D, setD] = useState("");
    const [E, setE] = useState("");
    const [F, setF] = useState("");
    const [metaDia, setMetaDia] = useState("");
    const [saida, setSaida] = useState("");

    useEffect(() => {
        setSaida("");
    }, [modo, A, B, D, E, F, metaDia]);


    const calc = useMemo(() => {
        const a = toNumberBR(A);
        const b = toNumberBR(B);
        const d = toNumberBR(D);
        const e = toNumberBR(E);
        const f = toNumberBR(F);
        const meta = toNumberBR(metaDia);

        if (!Number.isFinite(a) || a <= 0) return { ok: false as const, msg: "Informe A (dias) válido." };
        if (!Number.isFinite(b)) return { ok: false as const, msg: "Informe B (lucro histórico) válido." };
        if (!Number.isFinite(e)) return { ok: false as const, msg: "Informe E (custo) válido." };
        if (!Number.isFinite(meta) || meta <= 0) return { ok: false as const, msg: "Informe a meta/dia alvo válida." };

        const lucroDiarioHist = b / a;
        const lucroUnitMin = lucroDiarioHist / meta;

        if (!Number.isFinite(lucroUnitMin) || lucroUnitMin <= 0) {
            return { ok: false as const, msg: "Lucro unitário mínimo inválido." };
        }

        if (modo === "PRECO") {
            if (!Number.isFinite(f)) return { ok: false as const, msg: "Para calcular D, informe F (reembolso)." };
            const precoSugerido = lucroUnitMin + e - f;
            return { ok: true as const, precoSugerido, reembolsoMin: f, lucroUnitMin, lucroDiarioHist };
        }

        if (!Number.isFinite(d)) return { ok: false as const, msg: "Para calcular F, informe D (preço)." };
        const reembolsoCalc = lucroUnitMin - (d - e);
        const reembolsoMin = Math.max(0, reembolsoCalc);
        const precisaReembolso = reembolsoCalc > 0;

        return { ok: true as const, precoSugerido: d, reembolsoMin, lucroUnitMin, lucroDiarioHist, precisaReembolso };

    }, [modo, A, B, D, E, F, metaDia]);

    function calcular() {
        if (!calc.ok) {
            setSaida(calc.msg);
            return;
        }
        if (modo === "PRECO") setSaida(`Preço promo sugerido: R$ ${formatBR(calc.precoSugerido)}`);
        if (modo === "REEMBOLSO") {
            const msgExtra = (calc as any).precisaReembolso ? "" : " (não necessita)";
            setSaida(`Reembolso mínimo: R$ ${formatBR(calc.reembolsoMin)}${msgExtra}`);
            return;
        }

    }

    function aplicarNoSimulador() {
        if (!calc.ok) return;

        const draft = {
            A,
            B,
            D: modo === "PRECO" ? toBRString(calc.precoSugerido) : D,
            E,
            F: modo === "REEMBOLSO" ? toBRString(calc.reembolsoMin) : F,
        };

        sessionStorage.setItem("simulador_draft", JSON.stringify(draft));
        router.push("/");
    }

    const labelStyle: React.CSSProperties = {
        display: "block",
        marginBottom: "6px",
        fontSize: "14px",
        fontWeight: 500,
        color: "#374151",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        border: "1px solid #d1d5db",
        borderRadius: "12px",
        padding: "8px 12px",
        fontSize: "14px",
        boxSizing: "border-box",
        backgroundColor: "#f9fafb",
    };

    const btnSecStyle: React.CSSProperties = {
        padding: "8px 12px",
        borderRadius: "12px",
        border: "1px solid #d1d5db",
        backgroundColor: "#ffffff",
        color: "#4b5563",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
    };

    const btnPrimStyle: React.CSSProperties = {
        padding: "8px 12px",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
    };

    return (
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            <section
                className="bg-white shadow-md p-6 md:p-7"
                style={{
                    maxWidth: "520px",
                    margin: "0 auto",
                    borderRadius: "18px",
                    borderWidth: "3px",
                    borderStyle: "solid",
                    borderColor: "#9ca3af",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <button type="button" onClick={() => router.push("/")} style={btnSecStyle}>
                        Voltar
                    </button>

                    <h2 className="text-xl md:text-2xl font-semibold text-slate-800 text-center" style={{ flex: 1 }}>
                        Calculadora Reversa
                    </h2>

                    <div style={{ width: "60px" }} />
                </div>

                <div style={{ maxWidth: "260px", margin: "0 auto" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        <button
                            type="button"
                            onClick={() => setModo("PRECO")}
                            style={{
                                ...btnSecStyle,
                                flex: 1,
                                border: modo === "PRECO" ? "1px solid #4f46e5" : "1px solid #d1d5db",
                                backgroundColor: modo === "PRECO" ? "#4f46e5" : "#ffffff",
                                color: modo === "PRECO" ? "#ffffff" : "#4b5563",
                                fontWeight: 800,
                            }}
                        >
                            Calcular Preço
                        </button>

                        <button
                            type="button"
                            onClick={() => setModo("REEMBOLSO")}
                            style={{
                                ...btnSecStyle,
                                flex: 1,
                                border: modo === "REEMBOLSO" ? "1px solid #4f46e5" : "1px solid #d1d5db",
                                backgroundColor: modo === "REEMBOLSO" ? "#4f46e5" : "#ffffff",
                                color: modo === "REEMBOLSO" ? "#ffffff" : "#4b5563",
                                fontWeight: 800,
                            }}
                        >
                            Calcular Reembolso
                        </button>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Período histórico (dias)</label>
                        <input style={inputStyle} value={A} onChange={(e) => setA(e.target.value)} placeholder="Ex: 30" />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Lucro total histórico (R$)</label>
                        <input style={inputStyle} value={B} onChange={(e) => setB(e.target.value)} placeholder="Ex: 1500,50" />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Custo unitário (R$)</label>
                        <input style={inputStyle} value={E} onChange={(e) => setE(e.target.value)} placeholder="Ex: 3,10" />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Meta de unidades por dia (alvo)</label>
                        <input style={inputStyle} value={metaDia} onChange={(e) => setMetaDia(e.target.value)} placeholder="Ex: 26" />
                    </div>

                    {modo === "PRECO" ? (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Receita adicional / reembolso (R$)</label>
                            <input style={inputStyle} value={F} onChange={(e) => setF(e.target.value)} placeholder="Ex: 0,25" />
                        </div>
                    ) : (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Preço promocional (R$)</label>
                            <input style={inputStyle} value={D} onChange={(e) => setD(e.target.value)} placeholder="Ex: 4,79" />
                        </div>
                    )}
                </div>

                {calc.ok && (
                    <div
                        style={{
                            marginTop: "8px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#f9fafb",
                            padding: "8px 10px",
                            fontSize: "12px",
                            color: "#111827",
                            fontWeight: 700,
                            lineHeight: 1.4,
                            textAlign: "center",
                        }}
                    >
                        Lucro diário histórico: R$ {formatBR(calc.lucroDiarioHist)} •
                        Lucro unit. mínimo (pela meta): R$ {formatBR(calc.lucroUnitMin)}
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={calcular}
                        style={{
                            ...btnPrimStyle,
                            marginTop: "20px",
                            padding: "8px 32px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                        }}
                    >
                        Calcular
                    </button>

                    <button
                        type="button"
                        onClick={aplicarNoSimulador}
                        disabled={!calc.ok}
                        style={{
                            ...btnSecStyle,
                            marginTop: "20px",
                            padding: "8px 18px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            opacity: calc.ok ? 1 : 0.6,
                            cursor: calc.ok ? "pointer" : "default",
                        }}
                    >
                        Aplicar no simulador
                    </button>
                </div>

                {saida && (
                    <div
                        style={{
                            marginTop: "10px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#f9fafb",
                            padding: "8px 10px",
                            fontSize: "12px",
                            color: "#111827",
                            fontWeight: 700,
                            lineHeight: 1.4,
                            maxWidth: "520px",
                            marginLeft: "auto",
                            marginRight: "auto",
                            textAlign: "center",
                        }}
                    >
                        {saida}
                    </div>


                )}

                {calc.ok && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
                        {modo === "PRECO" ? (
                            <button
                                type="button"
                                onClick={() => setD(toBRString(calc.precoSugerido))}
                                style={btnSecStyle}
                            >
                                Aplicar em Reembolso
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setF(toBRString(calc.reembolsoMin))}
                                style={btnSecStyle}
                            >
                                Aplicar em Preço
                            </button>
                        )}
                    </div>
                )}

            </section>
        </main>
    );
}
