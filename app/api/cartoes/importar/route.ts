import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem importar nomes." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { nomes } = body;

    if (!Array.isArray(nomes) || nomes.length === 0) {
      return NextResponse.json(
        { error: "Nenhum nome válido selecionado para importação." },
        { status: 400 }
      );
    }

    const registros = nomes
      .map((n) => ({ nome: String(n).trim().toUpperCase() }))
      .filter((r) => r.nome.length > 0);

    if (registros.length === 0) {
      return NextResponse.json(
        { error: "A lista de nomes enviada está vazia." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cartoes")
      .insert(registros)
      .select("id, nome");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      inseridos: data?.length ?? 0,
      registros: data ?? [],
    });
  } catch (err: any) {
    console.error("Erro na importação em lote:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar importação." },
      { status: 500 }
    );
  }
}
