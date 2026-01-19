"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: number;
  email: string;
  nome: string;
  role: "OWNER" | "USER";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetSenha, setResetSenha] = useState("");

  const canCreate = useMemo(() => {
    return nome.trim().length > 0 && email.trim().includes("@") && senha.trim().length >= 6;
  }, [nome, email, senha]);

  async function fetchUsers() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/users", { cache: "no-store" });
      if (r.status === 401) { router.push("/login"); return; }
      if (r.status === 403) { setErr("Acesso negado. Apenas OWNER."); return; }
      if (!r.ok) throw new Error("Falha ao listar usuários.");
      const data = await r.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function criarUsuario() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, role: "USER" }),
      });

      if (r.status === 401) { router.push("/login"); return; }
      if (r.status === 403) { setErr("Acesso negado. Apenas OWNER."); return; }

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Erro ao criar usuário.");

      setNome("");
      setEmail("");
      setSenha("");
      await fetchUsers();
    } catch (e: any) {
      setErr(e?.message || "Erro ao criar usuário.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAtivo(u: UserRow) {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !u.is_active }),
      });

      if (r.status === 401) { router.push("/login"); return; }
      if (r.status === 403) { setErr("Acesso negado. Apenas OWNER."); return; }

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Erro ao atualizar usuário.");

      await fetchUsers();
    } catch (e: any) {
      setErr(e?.message || "Erro ao atualizar usuário.");
    } finally {
      setLoading(false);
    }
  }

  async function resetarSenha() {
    if (!resetUserId || resetSenha.trim().length < 6) return;

    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${resetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: resetSenha }),
      });

      if (r.status === 401) { router.push("/login"); return; }
      if (r.status === 403) { setErr("Acesso negado. Apenas OWNER."); return; }

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Erro ao resetar senha.");

      setResetUserId(null);
      setResetSenha("");
      await fetchUsers();
    } catch (e: any) {
      setErr(e?.message || "Erro ao resetar senha.");
    } finally {
      setLoading(false);
    }
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
          maxWidth: "900px",
          margin: "0 auto",
          borderRadius: "18px",
          borderWidth: "3px",
          borderStyle: "solid",
          borderColor: "#9ca3af",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <button type="button" onClick={() => router.push("/")} style={btnSecStyle}>
            Voltar
          </button>

          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 text-center" style={{ flex: 1 }}>
            Admin — Usuários
          </h2>

          <div style={{ width: "60px" }} />
        </div>

        {err && (
          <div
            style={{
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
              padding: "8px 10px",
              fontSize: "12px",
              color: "#b91c1c",
              fontWeight: 800,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {err}
          </div>
        )}

        <div style={{ maxWidth: "520px", margin: "0 auto 16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
            Cadastrar comprador
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nome</label>
              <input style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Jessica" />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: compras@empresa.com" />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Senha (mín. 6)</label>
              <input style={inputStyle} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" type="password" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
            <button
              type="button"
              onClick={criarUsuario}
              disabled={loading || !canCreate}
              style={{
                ...btnPrimStyle,
                padding: "8px 32px",
                borderRadius: "10px",
                fontSize: "14px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                opacity: loading || !canCreate ? 0.6 : 1,
                cursor: loading || !canCreate ? "default" : "pointer",
              }}
            >
              {loading ? "Salvando..." : "Criar usuário"}
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#111827" }}>Usuários cadastrados</p>

            <button type="button" onClick={fetchUsers} style={btnSecStyle} disabled={loading}>
              Atualizar
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["ID", "Nome", "Email", "Role", "Ativo", "Ações"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        fontSize: "12px",
                        color: "#374151",
                        fontWeight: 800,
                        padding: "8px 6px",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>{u.id}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: "12px", fontWeight: 800, color: "#111827" }}>{u.nome}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>{u.email}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>{u.role}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>
                      {u.is_active ? "SIM" : "NÃO"}
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button type="button" style={btnSecStyle} onClick={() => toggleAtivo(u)} disabled={loading || u.role === "OWNER"}>
                          {u.is_active ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          style={btnSecStyle}
                          disabled={loading || u.role === "OWNER"}
                          onClick={() => {
                            setResetUserId(u.id);
                            setResetSenha("");
                          }}
                        >
                          Reset senha
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "10px 6px", fontSize: "12px", color: "#6b7280" }}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {resetUserId && (
            <div style={{ marginTop: "14px", borderTop: "1px dashed #e5e7eb", paddingTop: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
                Resetar senha do usuário ID {resetUserId}
              </p>

              <div style={{ maxWidth: "520px" }}>
                <label style={labelStyle}>Nova senha (mín. 6)</label>
                <input
                  style={inputStyle}
                  value={resetSenha}
                  onChange={(e) => setResetSenha(e.target.value)}
                  placeholder="••••••"
                  type="password"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={resetarSenha}
                  disabled={loading || resetSenha.trim().length < 6}
                  style={{
                    ...btnPrimStyle,
                    opacity: loading || resetSenha.trim().length < 6 ? 0.6 : 1,
                    cursor: loading || resetSenha.trim().length < 6 ? "default" : "pointer",
                  }}
                >
                  Confirmar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetUserId(null);
                    setResetSenha("");
                  }}
                  style={btnSecStyle}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
