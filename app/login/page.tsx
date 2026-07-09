"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";

const ink = "#16233D";
const paper = "#F6F4EE";
const brass = "#A9824C";
const slate = "#5B6472";
const line = "#D9D3C4";
const rust = "#9B3B32";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Usuário ou senha inválidos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ background: ink, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: brass }}>
            <Landmark size={26} color={ink} />
          </div>
          <h1
            className="text-3xl text-center tracking-tight"
            style={{ color: paper, fontFamily: "ui-serif, Georgia, serif" }}
          >
            Custódia de Cartões
          </h1>
          <p className="text-sm mt-2 tracking-widest uppercase" style={{ color: brass, letterSpacing: "0.18em" }}>
            Agência 91 · Controle de Tesouraria
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-md p-6" style={{ background: paper, border: `1px solid ${line}` }}>
          <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>
            Usuário
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="seu.usuario"
            autoFocus
            className="w-full mb-4 px-3 py-2 rounded outline-none"
            style={{ border: `1px solid ${line}`, background: "white", color: ink }}
            required
          />

          <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full mb-5 px-3 py-2 rounded outline-none"
            style={{ border: `1px solid ${line}`, background: "white", color: ink }}
            required
          />

          {error && (
            <div className="text-sm mb-4 px-3 py-2 rounded" style={{ background: "#FBEAE8", color: rust }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded font-medium text-sm disabled:opacity-60"
            style={{ background: ink, color: paper }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
