import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { extractText } from "unpdf";
import { cleanExtractedNames } from "@/lib/pdfUtils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "O arquivo deve ser um PDF (.pdf)." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const { text, totalPages } = await extractText(new Uint8Array(arrayBuffer));

    const fullText = Array.isArray(text) ? text.join("\n") : text || "";
    const nomes = cleanExtractedNames(fullText);

    if (nomes.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum nome pôde ser extraído automaticamente deste PDF. Verifique se o arquivo possui texto selecionável ou utilize a aba 'Colar Texto'.",
        },
        { status: 422 }
      );
    }

    // Busca nomes já existentes no banco para sinalizar duplicidades
    const { data: existentes } = await supabaseAdmin
      .from("cartoes")
      .select("nome");

    const setExistentes = new Set(
      (existentes ?? []).map((e) => e.nome.trim().toUpperCase())
    );

    const jaCadastrados = nomes.filter((n) => setExistentes.has(n));

    return NextResponse.json({
      totalPages,
      totalEncontrados: nomes.length,
      nomes,
      jaCadastrados,
    });
  } catch (err: any) {
    console.error("Erro ao extrair PDF:", err);
    return NextResponse.json(
      {
        error:
          "Falha ao ler o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido por senha.",
      },
      { status: 500 }
    );
  }
}
