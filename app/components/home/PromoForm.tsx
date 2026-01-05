"use client";

import type { FormState } from "@/lib/types";

type Campo = { id: keyof FormState; label: string; placeholder?: string };

type Props = {
  form: FormState;
  campos: Campo[];
  loading: boolean;
  onChange: (id: keyof FormState, value: string) => void;
  onCalculate: () => void;
};

export function PromoForm({ form, campos, loading, onChange, onCalculate }: Props) {
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
            <input
              type="text"
              placeholder="Ex: FLÁVIA / JÉSSICA"
              value={form.comprador}
              onChange={(e) => onChange("comprador", e.target.value)}
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
            disabled={loading}
            style={{
              marginTop: "20px",
              padding: "8px 32px",
              borderRadius: "10px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            }}
          >
            {loading ? "Calculando..." : "Calcular ➜"}
          </button>
        </div>
      </section>
    </main>
  );
}
