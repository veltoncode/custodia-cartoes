/**
 * Utilitários para parsing de seleção numérica e limpeza de texto extraído de PDFs de custódia.
 */

/**
 * Converte uma string de seleção numérica (ex: "1, 3, 4, 5-8, 12") em um conjunto de números válidos.
 * @param input String informada pelo usuário (ex: "1, 3, 4, 5-10")
 * @param max Número máximo aceito (tamanho da lista de itens)
 */
export function parseSelectionRange(input: string, max: number): number[] {
  if (!input || !input.trim()) return [];

  const selected = new Set<number>();
  // Divide por vírgula, ponto e vírgula ou espaço múltiplo
  const tokens = input
    .replace(/[;]/g, ",")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  for (const token of tokens) {
    // Caso de intervalo: ex: "5-10" ou "5 a 10" ou "5..10"
    const rangeMatch = token.match(/^(\d+)\s*(?:-|a|\.\.)\s*(\d+)$/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const minVal = Math.max(1, Math.min(start, end));
      const maxVal = Math.min(max, Math.max(start, end));
      for (let n = minVal; n <= maxVal; n++) {
        selected.add(n);
      }
      continue;
    }

    // Número individual
    const num = parseInt(token, 10);
    if (!isNaN(num) && num >= 1 && num <= max) {
      selected.add(num);
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

/**
 * Palavras ou padrões comuns em cabeçalhos/rodapés de relatórios bancários que devem ser ignorados.
 */
const PALAVRAS_IGNORAR = [
  "RELATÓRIO",
  "RELATORIO",
  "PÁGINA",
  "PAGINA",
  "PAGE",
  "EMISSÃO",
  "EMISSAO",
  "DATA",
  "HORA",
  "TOTAL",
  "SUBTOTAL",
  "AGÊNCIA",
  "AGENCIA",
  "CONTA",
  "EXTRATO",
  "CUSTODIA",
  "CUSTÓDIA",
  "PORTADOR",
  "TITULAR",
  "BANCO",
  "SISTEMA",
  "USUÁRIO",
  "USUARIO",
  "AUTENTICAÇÃO",
  "AUTENTICACAO",
  "COMPROVANTE",
  "NOME DO CLIENTE",
  "NOME COMPLETO",
];

/**
 * Limpa o texto bruto extraído de um PDF ou colado pelo usuário,
 * retornando uma lista sequencial de nomes potenciais.
 */
export function cleanExtractedNames(rawText: string): string[] {
  if (!rawText) return [];

  const lines = rawText.split(/\r?\n/);
  const result: string[] = [];
  const seen = new Set<string>();

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Remove prefixos como "1. ", "01 - ", "[1] ", "• ", "- "
    line = line.replace(/^(\d+[\.\-\)\s]+|\[\d+\]\s*|[\*\•\-\–]\s*)/, "").trim();

    // Se tiver menos de 3 caracteres, ignora
    if (line.length < 3) continue;

    // Se não tiver nenhuma letra, ignora (apenas números, traços, etc)
    if (!/[a-zA-ZÀ-ÿ]/.test(line)) continue;

    const upper = line.toUpperCase();

    // Ignora se for cabeçalho conhecido
    const isNoise = PALAVRAS_IGNORAR.some(
      (palavra) => upper === palavra || upper.startsWith(palavra + ":") || upper.startsWith(palavra + " ")
    );
    if (isNoise) continue;

    // Ignora formatos de data e hora (ex: 12/10/2026 10:20)
    if (/^\d{2}\/\d{2}\/\d{2,4}/.test(line)) continue;

    // Ignora CPF ou CNPJ isolados
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(line) || /^\d{11}$/.test(line)) continue;

    // Se a linha tiver apenas uma palavra e ela for muito curta ou código
    const words = line.split(/\s+/);
    if (words.length < 2 && line.length < 5) continue;

    // Limpa pontuações estranhas nas pontas
    const cleaned = upper.replace(/^[^A-ZÀ-ÿ0-9]+|[^A-ZÀ-ÿ0-9\.\s]+$/gi, "").trim();

    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }

  return result;
}
