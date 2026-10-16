import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.user.role !== "admin")
    return NextResponse.json({ error: "Apenas administradores podem editar registros." }, { status: 403 });

  const body = await req.json();
  const { nome } = body;

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("cartoes")
    .update({ nome: nome.trim().toUpperCase() })
    .eq("id", params.id)
    .select("id, nome")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.user.role !== "admin")
    return NextResponse.json({ error: "Apenas administradores podem excluir cartões." }, { status: 403 });

  const { error } = await supabaseAdmin.from("cartoes").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
