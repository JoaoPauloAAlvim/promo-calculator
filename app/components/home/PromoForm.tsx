"use client";

import { useRef } from "react";
import type { FormState } from "@/lib/types";
import Link from "next/link";


type Campo = { id: keyof FormState; label: string; placeholder?: string };
type Props = {
  form: FormState;
  campos: Campo[];
  loading: boolean;
  onChange: (id: keyof FormState, value: string) => void;
  onCalculate: () => void;

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



  hintOpen,
  hintText,
  pendingOpen,
  pendingSugestao,
  onApplySugestao,
  onIgnoreSugestao,
  canCalculate,
  validationMessage,


}: Props) {

  const refIni = useRef<HTMLInputElement | null>(null);
  const refFim = useRef<HTMLInputElement | null>(null);

  function ClearX({ onClick, right = "10px" }: { onClick: () => void; right?: string }) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          position: "absolute",
          right,
          top: "50%",
          transform: "translateY(-50%)",
          width: "22px",
          height: "22px",
          borderRadius: "999px",
          border: "none",
          backgroundColor: "#e5e7eb",
          color: "#374151",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    );
  }

  function CalendarBtn({ onClick }: { onClick: () => void }) {
    return (
      <button
        type="button"
        aria-label="Abrir calendário"
        title="Abrir calendário"
        onClick={onClick}
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "22px",
          height: "22px",
          borderRadius: "999px",
          border: "none",
          backgroundColor: "#e5e7eb",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3v2M17 3v2M4 8h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }



  function handleClearAll() {
    onChange("produto", "");
    onChange("categoria", "");
    onChange("marca", "");
    onChange("tipoPromocao", "");
    onChange("dataInicio", "");
    onChange("dataFim", "");
    onChange("dataBaseHistorico", "");

    onChange("A", "");
    onChange("B", "");
    onChange("D", "");
    onChange("E", "");
    onChange("F", "");

  }


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
          <div style={{ width: "72px" }} />

          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 text-center" style={{ flex: 1 }}>
            Informe os dados da promoção
          </h2>

        </div>

        <div style={{ maxWidth: "260px", margin: "0 auto" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Nome do produto
            </label>

            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Ex: CREME DENTAL COLGATE TRIPLA AÇÃO 120G"
                value={form.produto}
                onChange={(e) => onChange("produto", e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 36px 8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />
              {String(form.produto || "").trim() !== "" && (
                <ClearX onClick={() => onChange("produto", "")} />
              )}
            </div>

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

            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Ex: HIGIENE ORAL"
                value={form.categoria}
                onChange={(e) => onChange("categoria", e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 36px 8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />
              {String(form.categoria || "").trim() !== "" && (
                <ClearX onClick={() => onChange("categoria", "")} />
              )}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Marca
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Ex: COLGATE"
                value={form.marca}
                onChange={(e) => onChange("marca", e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 36px 8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />
              {String(form.marca || "").trim() !== "" && (
                <ClearX onClick={() => onChange("marca", "")} />
              )}
            </div>

          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Comprador
            </label>

            <input
              type="text"
              value={String(form.comprador || "").toUpperCase()}
              readOnly
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
              Mês base do histórico (IPCA)
            </label>

            <input
              type="month"
              value={form.dataBaseHistorico ? form.dataBaseHistorico.slice(0, 7) : ""}
              onChange={(e) => {
                const v = e.target.value;
                onChange("dataBaseHistorico", v ? `${v}-01` : "");
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
            />

            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px", fontWeight: 600 }}>
              Opcional. Se preenchido, corrige o lucro histórico (B) por IPCA até o mês do início da promoção.
            </div>
          </div>


          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Data de início da promoção
            </label>

            <div style={{ position: "relative" }}>
              <input
                ref={refIni}
                className="date-input"
                type="date"
                value={form.dataInicio}
                onChange={(e) => onChange("dataInicio", e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 72px 8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />

              {String(form.dataInicio || "").trim() !== "" && (
                <ClearX right="38px" onClick={() => onChange("dataInicio", "")} />
              )}

              <CalendarBtn
                onClick={() => {
                  const el: any = refIni.current;
                  if (!el) return;
                  if (typeof el.showPicker === "function") el.showPicker();
                  else el.focus();
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Data de fim da promoção
            </label>

            <div style={{ position: "relative" }}>
              <input
                ref={refFim}
                className="date-input"
                type="date"
                value={form.dataFim}
                onChange={(e) => onChange("dataFim", e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 72px 8px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f9fafb",
                }}
              />

              {String(form.dataFim || "").trim() !== "" && (
                <ClearX right="38px" onClick={() => onChange("dataFim", "")} />
              )}

              <CalendarBtn
                onClick={() => {
                  const el: any = refFim.current;
                  if (!el) return;
                  if (typeof el.showPicker === "function") el.showPicker();
                  else el.focus();
                }}
              />
            </div>

          </div>

          {campos.map((campo) => (
            <div key={campo.id} style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                {campo.label}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder={campo.placeholder}
                  value={form[campo.id] as any}
                  onChange={(e) => onChange(campo.id, e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    padding: "8px 36px 8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#f9fafb",
                  }}
                />
                {String(form[campo.id] || "").trim() !== "" && (
                  <ClearX onClick={() => onChange(campo.id, "")} />
                )}
              </div>

            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={loading || !canCalculate}
            style={{
              marginTop: "20px",
              padding: "8px 18px",
              borderRadius: "10px",
              backgroundColor: "#ffffff",
              color: "#374151",
              fontWeight: 700,
              fontSize: "14px",
              border: "1px solid #d1d5db",
              opacity: loading || !canCalculate ? 0.6 : 1,
              cursor: loading || !canCalculate ? "default" : "pointer",
            }}

          >
            Limpar tudo
          </button>

          <Link
            href="/reversa"
            style={{
              marginTop: "20px",
              padding: "8px 18px",
              borderRadius: "10px",
              backgroundColor: "#ffffff",
              color: "#4b5563",
              fontWeight: 700,
              fontSize: "14px",
              border: "1px solid #d1d5db",
              cursor: "pointer",
              whiteSpace: "nowrap",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
            }}
            title="Abrir Calculadora Reversa"
          >
            Reversa
          </Link>


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
