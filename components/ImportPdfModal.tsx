"use client";

import { useState } from "react";
import {
  X,
  UploadCloud,
  FileText,
  ClipboardPaste,
  CheckSquare,
  Square,
  AlertTriangle,
  Check,
  Trash2,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { parseSelectionRange, cleanExtractedNames } from "@/lib/pdfUtils";

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

type ItemExtraido = {
  id: number; // 1-based index
  nome: string;
  selecionado: boolean;
  jaCadastrado: boolean;
};

interface ImportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novos: { id: string; nome: string }[]) => void;
  nomesCadastradosExistentes: string[];
}

export default function ImportPdfModal({
  isOpen,
  onClose,
  onSuccess,
  nomesCadastradosExistentes,
}: ImportPdfModalProps) {
  const [tab, setTab] = useState<"pdf" | "texto">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [items, setItems] = useState<ItemExtraido[]>([]);
  const [rangeInput, setRangeInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  if (!isOpen) return null;

  const setExistentes = new Set(
    nomesCadastradosExistentes.map((n) => n.trim().toUpperCase())
  );

  async function handleFileSelect(selectedFile: File) {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor, selecione um arquivo no formato .pdf");
      return;
    }
    setFile(selectedFile);
    setErrorMessage("");
    await processPdf(selectedFile);
  }

  async function processPdf(targetFile: File) {
    setLoading(true);
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("file", targetFile);

      const res = await fetch("/api/cartoes/extrair-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Erro ao extrair dados do PDF.");
        setLoading(false);
        return;
      }

      carregarNomes(data.nomes);
    } catch {
      setErrorMessage("Erro de conexão ao processar o PDF.");
    } finally {
      setLoading(false);
    }
  }

  function handleProcessText() {
    if (!pastedText.trim()) {
      setErrorMessage("Cole ou digite os nomes da lista primeiro.");
      return;
    }
    setErrorMessage("");
    const nomes = cleanExtractedNames(pastedText);
    if (nomes.length === 0) {
      setErrorMessage("Nenhum nome válido encontrado no texto informado.");
      return;
    }
    carregarNomes(nomes);
  }

  function carregarNomes(nomes: string[]) {
    const list: ItemExtraido[] = nomes.map((nome, index) => ({
      id: index + 1,
      nome,
      selecionado: false, // Inicia desmarcado para que o usuário informe exatamente os nº que deseja
      jaCadastrado: setExistentes.has(nome),
    }));
    setItems(list);
    setRangeInput("");
  }

  // Aplica a seleção por intervalo numérico (ex: "1, 3, 4, 5-10")
  function aplicarRange(inputStr: string) {
    if (!items.length) return;
    const selecionados = new Set(parseSelectionRange(inputStr, items.length));
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selecionado: selecionados.has(item.id),
      }))
    );
  }

  function toggleItem(id: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selecionado: !item.selecionado } : item
      )
    );
  }

  function selecionarTodos() {
    setItems((prev) => prev.map((item) => ({ ...item, selecionado: true })));
  }

  function desmarcarTodos() {
    setItems((prev) => prev.map((item) => ({ ...item, selecionado: false })));
  }

  function inverterSelecao() {
    setItems((prev) => prev.map((item) => ({ ...item, selecionado: !item.selecionado })));
  }

  function removerItem(id: number) {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      // Renumera de 1 a N
      return filtered.map((item, idx) => ({ ...item, id: idx + 1 }));
    });
  }

  function startEdit(item: ItemExtraido) {
    setEditingId(item.id);
    setEditingText(item.nome);
  }

  function saveEdit(id: number) {
    if (!editingText.trim()) return;
    const updated = editingText.trim().toUpperCase();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              nome: updated,
              jaCadastrado: setExistentes.has(updated),
            }
          : item
      )
    );
    setEditingId(null);
  }

  async function handleConfirmImport() {
    const selecionados = items.filter((i) => i.selecionado);
    if (selecionados.length === 0) {
      setErrorMessage("Selecione ao menos um nome para importar.");
      return;
    }

    setImporting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/cartoes/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomes: selecionados.map((s) => s.nome),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Erro ao importar nomes.");
        setImporting(false);
        return;
      }

      onSuccess(data.registros ?? []);
      onClose();
    } catch {
      setErrorMessage("Erro de conexão ao realizar a importação.");
    } finally {
      setImporting(false);
    }
  }

  const selecionadosCount = items.filter((i) => i.selecionado).length;
  const jaCadastradosCount = items.filter(
    (i) => i.selecionado && i.jaCadastrado
  ).length;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
      style={{ background: "rgba(22,35,61,0.65)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-md flex flex-col max-h-[90vh] shadow-2xl"
        style={{ background: paper, border: `1px solid ${line}` }}
      >
        {/* Cabeçalho do Modal */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: `1px solid ${line}`, background: paperDeep }}
        >
          <div>
            <h2
              style={{ fontFamily: "ui-serif, Georgia, serif", color: ink }}
              className="text-lg font-semibold flex items-center gap-2"
            >
              <FileText size={20} color={brass} />
              Importar Lista de Nomes (PDF)
            </h2>
            <p className="text-xs" style={{ color: slate }}>
              Extraia a lista do PDF e digite os números dos cartões em custódia para inclusão.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-black/5 transition"
            title="Fechar"
          >
            <X size={18} color={slate} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Se ainda não extraiu nenhum item, exibe tela de upload/colar */}
          {items.length === 0 ? (
            <div>
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b pb-2" style={{ borderColor: line }}>
                <button
                  type="button"
                  onClick={() => setTab("pdf")}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded font-semibold transition flex items-center gap-1.5`}
                  style={{
                    background: tab === "pdf" ? ink : "transparent",
                    color: tab === "pdf" ? paper : slate,
                  }}
                >
                  <UploadCloud size={14} /> Arquivo PDF
                </button>
                <button
                  type="button"
                  onClick={() => setTab("texto")}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded font-semibold transition flex items-center gap-1.5`}
                  style={{
                    background: tab === "texto" ? ink : "transparent",
                    color: tab === "texto" ? paper : slate,
                  }}
                >
                  <ClipboardPaste size={14} /> Colar Texto
                </button>
              </div>

              {tab === "pdf" ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer hover:bg-black/[0.02]"
                  style={{ borderColor: brass }}
                  onClick={() => document.getElementById("pdf-upload-input")?.click()}
                >
                  <input
                    id="pdf-upload-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />
                  <UploadCloud size={38} className="mx-auto mb-3" color={brass} />
                  <p className="text-sm font-semibold" style={{ color: ink }}>
                    Clique para selecionar ou arraste o arquivo PDF aqui
                  </p>
                  <p className="text-xs mt-1" style={{ color: slate }}>
                    Documento de relatório bancário contendo a relação de cartões
                  </p>
                  {loading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium" style={{ color: teal }}>
                      <RefreshCw size={14} className="animate-spin" />
                      Lendo e extraindo nomes do PDF...
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: slate }}>
                    Cole aqui as linhas ou colunas copiadas do documento:
                  </label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="BEATRIZ ALMEIDA COSTA&#10;CARLOS EDUARDO NUNES&#10;DÉBORA LIMA FERREIRA..."
                    className="w-full px-3 py-2 text-xs rounded outline-none font-mono"
                    style={{ border: `1px solid ${line}`, background: "white", color: ink }}
                  />
                  <button
                    type="button"
                    onClick={handleProcessText}
                    className="mt-3 px-4 py-2 rounded text-xs font-semibold"
                    style={{ background: ink, color: paper }}
                  >
                    Processar Texto
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Tela com Lista de Nomes Extraídos e Seleção Numérica */
            <div>
              {/* Barra de controle por números */}
              <div
                className="p-3.5 rounded mb-4"
                style={{ background: paperDeep, border: `1px solid ${line}` }}
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: ink }}>
                    Digite os números dos cartões a incluir:
                  </span>
                  <div className="flex gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={selecionarTodos}
                      className="px-2 py-0.5 rounded hover:bg-black/5"
                      style={{ color: teal }}
                    >
                      Todos
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={desmarcarTodos}
                      className="px-2 py-0.5 rounded hover:bg-black/5"
                      style={{ color: slate }}
                    >
                      Nenhum
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={inverterSelecao}
                      className="px-2 py-0.5 rounded hover:bg-black/5"
                      style={{ color: brassDeep }}
                    >
                      Inverter
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={rangeInput}
                    onChange={(e) => {
                      setRangeInput(e.target.value);
                      aplicarRange(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        aplicarRange(rangeInput);
                      }
                    }}
                    placeholder="Ex: 1, 3, 4, 5-10, 15"
                    className="flex-1 px-3 py-1.5 rounded text-sm outline-none font-mono"
                    style={{ border: `1px solid ${line}`, background: "white", color: ink }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => aplicarRange(rangeInput)}
                    className="px-3 py-1.5 rounded text-xs font-semibold"
                    style={{ background: teal, color: "white" }}
                  >
                    Aplicar
                  </button>
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: slate }}>
                  Dica: use vírgula para números avulsos e hífen para intervalos contínuos (ex: <code>1, 3, 5-8</code>).
                </p>
              </div>

              {/* Status de Seleção */}
              <div className="flex items-center justify-between text-xs mb-2 px-1">
                <span style={{ color: inkSoft, fontWeight: 600 }}>
                  {selecionadosCount} de {items.length} nomes selecionados
                </span>
                {jaCadastradosCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: rust }}>
                    <AlertTriangle size={13} />
                    {jaCadastradosCount} já existente(s) no sistema
                  </span>
                )}
              </div>

              {/* Tabela de itens extraídos */}
              <div
                className="rounded border overflow-hidden max-h-72 overflow-y-auto"
                style={{ borderColor: line, background: "white" }}
              >
                <div
                  className="grid grid-cols-[44px_44px_1fr_auto] text-[11px] uppercase tracking-wider px-3 py-2 sticky top-0 z-10 font-semibold"
                  style={{ background: paperDeep, color: slate, borderBottom: `1px solid ${line}` }}
                >
                  <div className="text-center">Inc.</div>
                  <div className="text-center">Nº</div>
                  <div>Nome Extraído</div>
                  <div className="text-right">Ação</div>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="grid grid-cols-[44px_44px_1fr_auto] items-center px-3 py-2 text-xs border-b cursor-pointer transition select-none"
                    style={{
                      borderColor: line,
                      background: item.selecionado ? "#F0F7F4" : idx % 2 === 0 ? "white" : "#FAF9F6",
                    }}
                  >
                    {/* Checkbox */}
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="p-1 rounded text-teal-800"
                      >
                        {item.selecionado ? (
                          <CheckSquare size={16} color={teal} />
                        ) : (
                          <Square size={16} color={slate} />
                        )}
                      </button>
                    </div>

                    {/* Número sequencial */}
                    <div className="text-center font-mono font-bold" style={{ color: brassDeep }}>
                      {item.id}
                    </div>

                    {/* Nome (com edição inline opcional) */}
                    <div className="pr-2" onClick={(e) => e.stopPropagation()}>
                      {editingId === item.id ? (
                        <div className="flex gap-1">
                          <input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(item.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-full px-2 py-0.5 text-xs rounded border outline-none font-medium"
                            style={{ borderColor: brass, color: ink }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveEdit(item.id)}
                            className="p-1 rounded text-xs"
                            style={{ background: teal, color: "white" }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium truncate"
                            style={{ color: item.selecionado ? ink : slate }}
                          >
                            {item.nome}
                          </span>
                          {item.jaCadastrado && (
                            <span
                              className="text-[10px] px-1.5 py-0.2 rounded font-normal shrink-0"
                              style={{ background: "#FDE8E8", color: rust }}
                            >
                              Já cadastrado
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ações da linha */}
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="p-1 rounded hover:bg-black/5"
                        title="Editar nome"
                      >
                        <Edit2 size={13} color={slate} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removerItem(item.id)}
                        className="p-1 rounded hover:bg-black/5"
                        title="Remover da lista"
                      >
                        <Trash2 size={13} color={rust} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div
              className="mt-3 px-3 py-2 rounded text-xs flex items-center gap-2"
              style={{ background: "#FBEAE8", color: rust }}
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div
          className="px-5 py-3.5 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: `1px solid ${line}`, background: paperDeep }}
        >
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setFile(null);
                setPastedText("");
                setErrorMessage("");
              }}
              className="text-xs underline"
              style={{ color: slate }}
            >
              ← Carregar outro arquivo
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 rounded text-xs font-medium"
              style={{ border: `1px solid ${line}`, color: ink }}
            >
              Cancelar
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || selecionadosCount === 0}
                className="px-5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: teal, color: "white" }}
              >
                {importing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Importar {selecionadosCount} {selecionadosCount === 1 ? "nome" : "nomes"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
