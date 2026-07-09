import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, username, nome, role, created_at")
    .order("nome", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { username, password, nome, role } = await req.json();

  if (!username?.trim() || !password || password.length < 6 || !nome?.trim() || !["admin", "consulta"].includes(role)) {
    return NextResponse.json(
      { error: "Dados inválidos. A senha precisa ter ao menos 6 caracteres." },
      { status: 400 }
    );
  }

  const usernameNormalizado = username.trim().toLowerCase();
  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .insert({ username: usernameNormalizado, password_hash, nome: nome.trim(), role })
    .select("id, username, nome, role, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Esse nome de usuário já existe." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
