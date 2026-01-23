"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { mes: string; indice: string | number };

export default function AdminIpcaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [texto, setTexto] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  async function fetchRows() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/ipca", { cache: "no-store" });
      if (r.status === 401) { router.push("/login"); return; }
      if (r.status === 403) { setErr("Acesso negado. Apenas OWNER."); return; }
      if (!r.ok) throw new Error("Falha ao listar IPCA.");
      const data = await r.json();
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar IPCA.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRows(); }, []);

  async function importar() {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      const lines = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      const items = lines.map((l) => {
        let mes = "";
        let indice = "";

        if (l.includes(";")) {
          const [m, ...rest] = l.split(";");
          mes = (m || "").trim();
          indice = rest.join(";").trim();
        } else if (l.includes("\t")) {
          const [m, ...rest] = l.split("\t");
          mes = (m || "").trim();
          indice = rest.join("\t").trim();
        } else {
          const [m, ...rest] = l.split(",");
          mes = (m || "").trim();
          indice = rest.join(",").trim();
        }

        return { mes, indice };
      });


      const r = await fetch("/api/admin/ipca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (r.status === 401) { router.push("/login"); return; }
      if (r.status === 403) { setErr("Acesso negado. Apenas OWNER."); return; }

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Erro ao importar IPCA.");

      setOkMsg(`Importado/atualizado: ${data.upserted} mês(es).`);
      await fetchRows();
    } catch (e: any) {
      setErr(e?.message || "Erro ao importar.");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 800, color: "#374151" } as const;
  const inputStyle = { width: "100%", border: "1px solid #d1d5db", borderRadius: "12px", padding: "8px 12px", fontSize: "14px", boxSizing: "border-box", backgroundColor: "#f9fafb" } as const;
  const btn = { padding: "8px 14px", borderRadius: "10px", border: "none", backgroundColor: "#4f46e5", color: "#fff", fontWeight: 800, cursor: "pointer" } as const;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <section className="bg-white shadow-md p-6 md:p-7" style={{ maxWidth: "900px", margin: "0 auto", borderRadius: "18px", border: "3px solid #9ca3af" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={() => router.push("/admin/users")} style={{ ...btn, backgroundColor: "#111827" }}>Admin Usuários</button>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 text-center" style={{ flex: 1 }}>Admin — IPCA</h2>
          <button type="button" onClick={() => router.push("/")} style={{ ...btn, backgroundColor: "#6b7280" }}>Home</button>
        </div>

        {err && <div style={{ marginBottom: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: 10, borderRadius: 10, color: "#b91c1c", fontWeight: 800 }}>{err}</div>}
        {okMsg && <div style={{ marginBottom: 12, border: "1px solid #bbf7d0", background: "#f0fdf4", padding: 10, borderRadius: 10, color: "#166534", fontWeight: 800 }}>{okMsg}</div>}

        <div style={{ maxWidth: 760, margin: "0 auto 16px" }}>
          <label style={labelStyle}>Cole linhas no formato: YYYY-MM;INDICE</label>
          <div style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, marginBottom: 8 }}>
            Ex.: <code>2022-07;6432,123</code> (índice “nível”, não % mensal). Separador pode ser <code>;</code>, <code>,</code> ou TAB.
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            wrap="off"
            style={{
              ...inputStyle,
              height: 220,
              maxHeight: 220,
              resize: "none",
              overflowY: "auto",
              overflowX: "auto",
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
            placeholder={"Ex:\n2022-07;6432,123\n2022-08;6501,987"}
          />


          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button type="button" style={btn} onClick={importar} disabled={loading}>Importar</button>
            <button type="button" style={{ ...btn, backgroundColor: "#6b7280" }} onClick={fetchRows} disabled={loading}>Atualizar lista</button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Mês", "Índice"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #e5e7eb", fontSize: 12, fontWeight: 900 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 36).map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>{String(r.mes).slice(0, 7)}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>{String(r.indice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>
    </main>
  );
}
