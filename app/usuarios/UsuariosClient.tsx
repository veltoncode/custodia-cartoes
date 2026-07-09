"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";

const ink = "#16233D";
const paper = "#F6F4EE";
const paperDeep = "#EDEAE0";
const teal = "#1F5D50";
const rust = "#9B3B32";
const slate = "#5B6472";
const line = "#D9D3C4";

type Usuario = { id: string; username: string; nome: string; role: "admin" | "consulta"; created_at: string };

function emptyForm() {
  return { username: "", password: "", nome: "", role: "consulta" as "admin" | "consulta" };
}

export default function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    if (res.ok) setUsuarios(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar usuário.");
        return;
      }
      setForm(emptyForm());
      load();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este usuário?")) return;
    const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error ?? "Erro ao remover.");
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ background: paperDeep, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <header style={{ background: ink }} className="px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1 text-sm" style={{ color: paper }}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 style={{ color: paper, fontFamily: "ui-serif, Georgia, serif" }} className="text-lg">
            Gerenciar usuários
          </h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <form onSubmit={handleSubmit} className="rounded-md p-6 mb-8" style={{ background: paper, border: `1px solid ${line}` }} autoComplete="off">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: ink }}>
            <UserPlus size={16} /> Novo usuário
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>Nome completo</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full px-3 py-2 rounded outline-none"
                style={{ border: `1px solid ${line}`, background: "white", color: ink }}
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>Usuário (login)</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 rounded outline-none"
                style={{ border: `1px solid ${line}`, background: "white", color: ink }}
                autoComplete="off"
                name="novo-usuario-login"
                required
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>Senha (mín. 6 caracteres)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 rounded outline-none"
                style={{ border: `1px solid ${line}`, background: "white", color: ink }}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>Perfil</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "consulta" })}
                className="w-full px-3 py-2 rounded outline-none"
                style={{ border: `1px solid ${line}`, background: "white", color: ink }}
              >
                <option value="consulta">Consulta</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          {error && (
            <div className="text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FBEAE8", color: rust }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-5 rounded font-medium text-sm disabled:opacity-60"
            style={{ background: teal, color: "white" }}
          >
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </form>

        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${line}`, background: "white" }}>
          {usuarios === null && (
            <div className="py-10 text-center text-sm" style={{ color: slate }}>Carregando...</div>
          )}
          {usuarios?.map((u, i) => (
            <div
              key={u.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
              style={{ borderBottom: i === usuarios.length - 1 ? "none" : `1px solid ${line}` }}
            >
              <div>
                <div style={{ color: ink, fontWeight: 500 }}>{u.nome}</div>
                <div style={{ color: slate }} className="text-xs">
                  @{u.username} · {u.role === "admin" ? "Administrador" : "Consulta"}
                </div>
              </div>
              <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded hover:bg-black/5">
                <Trash2 size={14} color={rust} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
