"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  ShieldCheck,
  Eye,
  X,
  CreditCard,
  Landmark,
  Users,
} from "lucide-react";

const ink = "#16233D";
const inkSoft = "#26385C";
const paper = "#F6F4EE";
const paperDeep = "#EDEAE0";
const brass = "#A9824C";
const brassDeep = "#8A6A3A";
const teal = "#1F5D50";
const rust = "#9B3B32";
const slate = "#5B6472";
const line = "#D9D3C4";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Cartao = { id: string; nome: string };
type SessionUser = { nome: string; role: "admin" | "consulta" };

function letterOf(nome: string) {
  const c = (nome || "").trim().charAt(0).toUpperCase();
  return ALPHABET.includes(c) ? c : "#";
}
function emptyForm() {
  return { id: null as string | null, nome: "" };
}

export default function Dashboard({ session }: { session: SessionUser }) {
  const isAdmin = session.role === "admin";

  const [records, setRecords] = useState<Cartao[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Cartao | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind?: string } | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cartoes");
        const data = await res.json();
        if (!cancelled) setRecords(res.ok ? data : []);
        if (!res.ok) showToast(data.error ?? "Erro ao carregar dados.", "erro");
      } catch {
        if (!cancelled) {
          setRecords([]);
          showToast("Erro de conexão ao carregar dados.", "erro");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(msg: string, kind = "ok") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }

  const filtered = useMemo(() => {
    if (!records) return [];
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => r.nome.toLowerCase().includes(q));
  }, [records, query]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const map: Record<string, Cartao[]> = {};
    for (const r of sorted) {
      const l = letterOf(r.nome);
      if (!map[l]) map[l] = [];
      map[l].push(r);
    }
    return map;
  }, [filtered]);

  const presentLetters = useMemo(() => new Set(Object.keys(grouped)), [grouped]);

  function jumpTo(letter: string) {
    setActiveLetter(letter);
    const el = sectionRefs.current[letter];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openNew() {
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  }
  function openEdit(r: Cartao) {
    setForm({ ...r });
    setFormError("");
    setModalOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return setFormError("Informe o nome completo.");

    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/cartoes/${form.id}` : "/api/cartoes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setFormError(data.error ?? "Erro ao salvar.");

      if (isEdit) {
        setRecords((prev) => (prev ?? []).map((r) => (r.id === data.id ? data : r)));
        showToast("Nome atualizado.");
      } else {
        setRecords((prev) => [...(prev ?? []), data]);
        showToast("Nome adicionado.");
      }
      setModalOpen(false);
    } catch {
      setFormError("Erro de conexão. Tente novamente.");
    }
  }

  async function doDelete(id: string) {
    try {
      const res = await fetch(`/api/cartoes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error ?? "Erro ao remover.", "erro");
        return;
      }
      setRecords((prev) => (prev ?? []).filter((r) => r.id !== id));
      showToast("Nome removido.", "erro");
    } catch {
      showToast("Erro de conexão. Tente novamente.", "erro");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ background: paperDeep, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      {/* Letterhead */}
      <header style={{ background: ink }} className="px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: brass }}>
              <Landmark size={18} color={ink} />
            </div>
            <div>
              <div style={{ color: paper, fontFamily: "ui-serif, Georgia, serif" }} className="text-lg leading-tight">
                Custódia de Cartões
              </div>
              <div className="text-xs uppercase tracking-widest" style={{ color: brass, letterSpacing: "0.14em" }}>
                Consulta de Nomes
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/usuarios" className="text-xs flex items-center gap-1 opacity-80 hover:opacity-100" style={{ color: paper }}>
                <Users size={14} /> Usuários
              </Link>
            )}
            <span
              className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{
                background: isAdmin ? "#3A2E1A" : "#173A32",
                color: isAdmin ? "#E7C892" : "#9FE0CE",
              }}
            >
              {isAdmin ? <ShieldCheck size={12} /> : <Eye size={12} />}
              {isAdmin ? "Administrador" : "Consulta"} · {session.nome}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs flex items-center gap-1 opacity-80 hover:opacity-100"
              style={{ color: paper }}
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: slate }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-3 py-2.5 rounded outline-none text-sm"
            style={{ border: `1px solid ${line}`, background: "white", color: ink }}
          />
        </div>
        <div className="text-xs" style={{ color: slate }}>
          {filtered.length} {filtered.length === 1 ? "nome" : "nomes"}
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded text-sm font-medium"
            style={{ background: teal, color: "white" }}
          >
            <Plus size={16} /> Novo nome
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 flex gap-6">
        {/* A-Z index rail */}
        <nav className="hidden sm:flex flex-col sticky top-4 self-start pt-2 gap-0.5" style={{ height: "fit-content" }}>
          {ALPHABET.map((l) => {
            const has = presentLetters.has(l);
            return (
              <button
                key={l}
                disabled={!has}
                onClick={() => jumpTo(l)}
                className="w-6 text-center text-[11px] leading-5 rounded transition"
                style={{
                  color: has ? (activeLetter === l ? "white" : brassDeep) : "#C9C2AF",
                  background: has && activeLetter === l ? brass : "transparent",
                  fontWeight: has ? 600 : 400,
                  cursor: has ? "pointer" : "default",
                }}
              >
                {l}
              </button>
            );
          })}
        </nav>

        {/* Ledger list */}
        <div className="flex-1 min-w-0">
          {records === null && (
            <div className="py-16 text-center text-sm" style={{ color: slate }}>
              Carregando registros...
            </div>
          )}

          {records !== null && filtered.length === 0 && (
            <div className="py-16 text-center rounded" style={{ background: "white", border: `1px dashed ${line}` }}>
              <CreditCard size={28} className="mx-auto mb-3" color={slate} />
              <p className="text-sm" style={{ color: ink }}>
                {query ? "Nenhum nome encontrado para essa busca." : "Nenhum nome cadastrado ainda."}
              </p>
              {isAdmin && !query && (
                <button onClick={openNew} className="mt-3 text-sm underline" style={{ color: teal }}>
                  Cadastrar o primeiro nome
                </button>
              )}
            </div>
          )}

          {Object.keys(grouped)
            .sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
            .map((letter) => (
              <div key={letter} ref={(el) => { sectionRefs.current[letter] = el; }} className="mb-5">
                <div
                  className="text-sm font-semibold px-1 py-1.5 mb-1 sticky top-0 z-10"
                  style={{ color: brassDeep, background: paperDeep, fontFamily: "ui-serif, Georgia, serif" }}
                >
                  {letter}
                </div>
                <div className="rounded overflow-hidden" style={{ border: `1px solid ${line}`, background: "white" }}>
                  <div
                    className="flex items-center justify-between text-[11px] uppercase tracking-wide px-4 py-2"
                    style={{
                      color: slate,
                      background: "#FAF9F5",
                      borderBottom: `1px solid ${line}`,
                    }}
                  >
                    <div>Nome do Titular</div>
                    {isAdmin && <div>Ações</div>}
                  </div>
                  {grouped[letter].map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                      style={{ borderBottom: i === grouped[letter].length - 1 ? "none" : `1px solid ${line}` }}
                    >
                      <div style={{ color: ink, fontWeight: 500 }}>{r.nome}</div>
                      {isAdmin && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(r)} title="Editar" className="p-1.5 rounded hover:bg-black/5">
                            <Pencil size={14} color={slate} />
                          </button>
                          <button onClick={() => setConfirmDelete(r)} title="Remover" className="p-1.5 rounded hover:bg-black/5">
                            <Trash2 size={14} color={rust} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal: add/edit */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(22,35,61,0.55)" }}
          onClick={() => setModalOpen(false)}
        >
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitForm} className="w-full max-w-md rounded-md p-6" style={{ background: paper }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "ui-serif, Georgia, serif", color: ink }} className="text-xl">
                {form.id ? "Editar nome" : "Novo nome"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X size={18} color={slate} />
              </button>
            </div>

            <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>Nome completo</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })}
              placeholder="Ex: BEATRIZ ALMEIDA COSTA"
              className="w-full mb-4 px-3 py-2 rounded outline-none"
              style={{ border: `1px solid ${line}`, background: "white", color: ink }}
              autoFocus
            />

            {formError && (
              <div className="text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FBEAE8", color: rust }}>
                {formError}
              </div>
            )}

            <button type="submit" className="w-full py-2.5 rounded font-medium text-sm" style={{ background: ink, color: paper }}>
              {form.id ? "Salvar alterações" : "Adicionar nome"}
            </button>
          </form>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(22,35,61,0.55)" }}
          onClick={() => setConfirmDelete(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-md p-6" style={{ background: paper }}>
            <h3 style={{ fontFamily: "ui-serif, Georgia, serif", color: ink }} className="text-lg mb-2">
              Remover nome?
            </h3>
            <p className="text-sm mb-5" style={{ color: slate }}>
              O registro de <strong style={{ color: ink }}>{confirmDelete.nome}</strong> será removido do sistema. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded text-sm" style={{ border: `1px solid ${line}`, color: ink }}>
                Cancelar
              </button>
              <button onClick={() => doDelete(confirmDelete.id)} className="flex-1 py-2 rounded text-sm font-medium" style={{ background: rust, color: "white" }}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded text-sm z-50"
          style={{ background: toast.kind === "erro" ? rust : teal, color: "white" }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
