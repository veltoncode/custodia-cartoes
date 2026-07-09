import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function cpfValido(cpf: string) {
  return cpf.replace(/\D/g, "").length === 11;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("cartoes")
    .select("id, cpf, nome, agencia, cc")
    .order("nome", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.user.role !== "admin")
    return NextResponse.json({ error: "Apenas administradores podem cadastrar cartões." }, { status: 403 });

  const body = await req.json();
  const { cpf, nome, agencia, cc } = body;

  if (!nome?.trim() || !cpfValido(cpf ?? "") || !agencia?.trim() || !cc?.trim()) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { data: dupe } = await supabaseAdmin
    .from("cartoes")
    .select("id")
    .eq("cpf", cpf)
    .maybeSingle();
  if (dupe) {
    return NextResponse.json({ error: "Já existe um cartão cadastrado para este CPF." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("cartoes")
    .insert({ cpf, nome: nome.toUpperCase(), agencia, cc })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
