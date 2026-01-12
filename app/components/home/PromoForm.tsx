"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/types";
import type { DefaultBuyer } from "@/lib/storageKeys";

type Campo = { id: keyof FormState; label: string; placeholder?: string };
type Props = {
  form: FormState;
  campos: Campo[];
  loading: boolean;
  onChange: (id: keyof FormState, value: string) => void;
  onCalculate: () => void;

  defaultBuyer: DefaultBuyer;
  onDefaultBuyerChange: (next: DefaultBuyer) => void;
  hydrated: boolean;

  opcoesComprador: string[];
  modoComprador: "LISTA" | "OUTRO";
  setModoComprador: (v: "LISTA" | "OUTRO") => void;
  compradorOutro: string;
  setCompradorOutro: (v: string) => void;

  hintOpen: boolean;
  hintText: string;

  pendingOpen: boolean;
  pendingSugestao: null | { marca: string; categoria: string };
  onApplySugestao: () => void;
  onIgnoreSugestao: () => void;

  canCalculate: boolean;
  validationMessage: string;
};

export function PromoForm({
  form,
  campos,
  loading,
  onChange,
  onCalculate,

  opcoesComprador,
  modoComprador,
  setModoComprador,
  compradorOutro,
  setCompradorOutro,

  hintOpen,
  hintText,
  pendingOpen,
  pendingSugestao,
  onApplySugestao,
  onIgnoreSugestao,
  canCalculate,
  validationMessage,

  defaultBuyer,
  onDefaultBuyerChange,
  hydrated,
}: Props) {
  const appliedDefaultRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;

    const formHasBuyer = String(form.comprador || "").trim().length > 0;
    if (formHasBuyer) return;

    const savedMode = defaultBuyer?.mode;
    const savedValue = String(defaultBuyer?.value || "").trim();
    if (!savedValue) return;

    if (savedMode === "OUTRO") {
      setModoComprador("OUTRO");
      setCompradorOutro(savedValue);
      onChange("comprador", savedValue);
      return;
    }

    setModoComprador("LISTA");
    setCompradorOutro("");
    onChange("comprador", savedValue);
  }, [
    hydrated,
    defaultBuyer?.mode,
    defaultBuyer?.value,
    form.comprador,
    onChange,
    setModoComprador,
    setCompradorOutro,
  ]);

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
        <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2 text-center">
          Informe os dados da promoção
        </h2>

        <div style={{ maxWidth: "260px", margin: "0 auto" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Nome do produto
            </label>
            <input
              type="text"
              placeholder="Ex: CREME DENTAL COLGATE TRIPLA AÇÃO 120G"
              value={form.produto}
              onChange={(e) => onChange("produto", e.target.value)}
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

            {pendingOpen && pendingSugestao && (
              <div
                style={{
                  marginTop: "8px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontSize: "12px", color: "#4b5563", fontWeight: 600 }}>
                  Sugestão do histórico:{" "}
                  <strong>{pendingSugestao.marca || "—"}</strong>{" "}
                  /{" "}
                  <strong>{pendingSugestao.categoria || "—"}</strong>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={onApplySugestao}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Aplicar
                  </button>

                  <button
                    type="button"
                    onClick={onIgnoreSugestao}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#ffffff",
                      color: "#4b5563",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            )}

            {hintOpen && (
              <div
                style={{
                  marginTop: "8px",
                  borderRadius: "10px",
                  border: "1px solid #bfdbfe",
                  backgroundColor: "#eff6ff",
                  padding: "6px 10px",
                  fontSize: "12px",
                  color: "#1d4ed8",
                  fontWeight: 600,
                }}
              >
                {hintText}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Categoria do produto
            </label>
            <input
              type="text"
              placeholder="Ex: HIGIENE ORAL"
              value={form.categoria}
              onChange={(e) => onChange("categoria", e.target.value)}
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

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Comprador
            </label>

            {modoComprador === "LISTA" ? (
              <select
                value={form.comprador}
                onChange={(e) => {
                  const v = e.target.value;

                  if (v === "__OUTRO__") {
                    setModoComprador("OUTRO");
                    setCompradorOutro("");
                    onChange("comprador", "");
                    return;
                  }

                  onChange("comprador", v);

                  const vv = String(v || "").trim();
                  if (vv) onDefaultBuyerChange({ mode: "LISTA", value: vv });
                }}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              >
                <option value="">Selecione</option>

                {form.comprador && !opcoesComprador.includes(form.comprador) && (
                  <option value={form.comprador}>{form.comprador}</option>
                )}

                {opcoesComprador.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__OUTRO__">Outro…</option>
              </select>

            ) : (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Digite o nome do comprador"
                  value={compradorOutro}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCompradorOutro(v);
                    onChange("comprador", v);

                    // Salva como padrão (só se tiver valor)
                    const vv = String(v || "").trim();
                    if (vv) onDefaultBuyerChange({ mode: "OUTRO", value: vv });
                  }}
                  style={{
                    flex: "1 1 0",
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#f9fafb",
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setModoComprador("LISTA");
                    setCompradorOutro("");
                    onChange("comprador", "");
                    // Não zera o default salvo aqui; ele será atualizado quando selecionar da lista.
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    color: "#4b5563",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Voltar
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Marca
            </label>
            <input
              type="text"
              placeholder="Ex: COLGATE"
              value={form.marca}
              onChange={(e) => onChange("marca", e.target.value)}
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

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Tipo da promoção
            </label>

            <select
              value={form.tipoPromocao}
              onChange={(e) => onChange("tipoPromocao", e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "8px 12px",
                fontSize: "14px",
                boxSizing: "border-box",
                backgroundColor: "#f9fafb",
              }}
            >
              <option value="">Selecione</option>
              <option value="INTERNA">INTERNA</option>
              <option value="SCANNTECH">SCANNTECH</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Data de início da promoção
            </label>
            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => onChange("dataInicio", e.target.value)}
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

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Data de fim da promoção
            </label>
            <input
              type="date"
              value={form.dataFim}
              onChange={(e) => onChange("dataFim", e.target.value)}
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

          {campos.map((campo) => (
            <div key={campo.id} style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                {campo.label}
              </label>
              <input
                type="text"
                placeholder={campo.placeholder}
                value={form[campo.id] as any}
                onChange={(e) => onChange(campo.id, e.target.value)}
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
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={onCalculate}
            disabled={loading || !canCalculate}
            style={{
              marginTop: "20px",
              padding: "8px 32px",
              borderRadius: "10px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              opacity: loading || !canCalculate ? 0.6 : 1,
              cursor: loading || !canCalculate ? "default" : "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            }}
          >
            {loading ? "Calculando..." : "Calcular ➜"}
          </button>
        </div>

        {!canCalculate && validationMessage && (
          <div
            style={{
              marginTop: "10px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              padding: "8px 10px",
              fontSize: "12px",
              color: "#4b5563",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {validationMessage}
          </div>
        )}
      </section>
    </main>
  );
}
