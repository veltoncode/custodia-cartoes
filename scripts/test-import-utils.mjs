import { parseSelectionRange, cleanExtractedNames } from "../lib/pdfUtils.ts";

function assert(condition, message) {
  if (!condition) {
    console.error("❌ FALHA:", message);
    process.exit(1);
  } else {
    console.log("✅ PASSOU:", message);
  }
}

console.log("=== Testando parseSelectionRange ===");

// 1. Números individuais
const r1 = parseSelectionRange("1, 3, 5", 10);
assert(JSON.stringify(r1) === JSON.stringify([1, 3, 5]), "Números avulsos: 1, 3, 5");

// 2. Intervalos com hífen
const r2 = parseSelectionRange("5-8", 10);
assert(JSON.stringify(r2) === JSON.stringify([5, 6, 7, 8]), "Intervalo simples: 5-8");

// 3. Misto: avulsos + intervalos
const r3 = parseSelectionRange("1, 3, 4, 5-8, 12", 15);
assert(
  JSON.stringify(r3) === JSON.stringify([1, 3, 4, 5, 6, 7, 8, 12]),
  "Misto: 1, 3, 4, 5-8, 12"
);

// 4. Ignorar fora dos limites (> max ou <= 0)
const r4 = parseSelectionRange("0, 2, 11, 15", 5);
assert(JSON.stringify(r4) === JSON.stringify([2]), "Filtro de limites: 0, 2, 11, 15 em max=5");

// 5. Suporte a 'a' e '..'
const r5 = parseSelectionRange("2 a 4, 7..9", 10);
assert(JSON.stringify(r5) === JSON.stringify([2, 3, 4, 7, 8, 9]), "Variações 'a' e '..'");

console.log("\n=== Testando cleanExtractedNames ===");

const rawReport = `
RELATÓRIO DE CUSTÓDIA DE CARTÕES
PÁGINA 1 DE 3
DATA: 16/10/2026 HORA: 10:30
------------------------------------------------
1. BEATRIZ ALMEIDA COSTA
2 - CARLOS EDUARDO NUNES
[3] DÉBORA LIMA FERREIRA
04. EDUARDO HENRIQUE SOUZA
123.456.789-00
TOTAL DE REGISTROS: 4
`;

const nomes = cleanExtractedNames(rawReport);
assert(nomes.length === 4, "Extraiu exatamente 4 nomes válidos");
assert(nomes[0] === "BEATRIZ ALMEIDA COSTA", "Nome 1 normalizado");
assert(nomes[1] === "CARLOS EDUARDO NUNES", "Nome 2 normalizado");
assert(nomes[2] === "DÉBORA LIMA FERREIRA", "Nome 3 normalizado");
assert(nomes[3] === "EDUARDO HENRIQUE SOUZA", "Nome 4 normalizado");

console.log("\n🎉 Todos os testes de utilitários passaram com sucesso!");
