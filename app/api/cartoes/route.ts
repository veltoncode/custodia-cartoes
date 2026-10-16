import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("cartoes")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.user.role !== "admin")
    return NextResponse.json({ error: "Apenas administradores podem cadastrar nomes." }, { status: 403 });

  const body = await req.json();
  const { nome } = body;

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("cartoes")
    .insert({ nome: nome.trim().toUpperCase() })
    .select("id, nome")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
