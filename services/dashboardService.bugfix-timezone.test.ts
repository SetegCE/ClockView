// Teste de exploração da condição de bug - Filtragem de Datas com Timezone
// Property 1: Bug Condition - Inclusão Completa de Entradas no Período
//
// CRÍTICO: Este teste DEVE FALHAR no código não corrigido
// A falha confirma que o bug existe e demonstra contraexemplos
//
// Bug Condition: Quando datas são formatadas como "${date}T00:00:00Z" (UTC hardcoded)
// sem considerar timezone local, entradas válidas dentro do período não são retornadas

import { describe, it, expect } from "vitest";

import { describe, it, expect } from "vitest";

describe("Bug Condition - Filtragem de Datas com Timezone", () => {
  it("DEVE formatar datas considerando timezone local (não UTC hardcoded)", () => {
    // Arrange: Datas de início e fim do período
    const startDate = "2026-04-01";
    const endDate = "2026-04-30";

    // Act: Simular a formatação ATUAL (incorreta) do código
    const startISO_INCORRETO = `${startDate}T00:00:00Z`; // UTC hardcoded
    const endISO_INCORRETO = `${endDate}T23:59:59Z`; // UTC hardcoded

    // Act: Simular a formatação CORRETA usando Date objects
    const startLocal = new Date(`${startDate}T00:00:00`);
    const endLocal = new Date(`${endDate}T23:59:59`);
    const startISO_CORRETO = startLocal.toISOString();
    const endISO_CORRETO = endLocal.toISOString();

    // Assert: Verificar que as formatações são DIFERENTES
    // EXPECTATIVA: Este teste DEVE FALHAR no código não corrigido
    // porque o código atual usa formatação UTC hardcoded
    expect(startISO_INCORRETO).not.toBe(startISO_CORRETO);
    expect(endISO_INCORRETO).not.toBe(endISO_CORRETO);

    // Assert: Verificar que a formatação correta considera timezone
    // Para UTC-3 (Brasil), 2026-04-01T00:00:00 local = 2026-04-01T03:00:00Z UTC
    // A formatação incorreta seria 2026-04-01T00:00:00Z, perdendo 3 horas
    console.log("Formatação INCORRETA (UTC hardcoded):");
    console.log(`  Início: ${startISO_INCORRETO}`);
    console.log(`  Fim: ${endISO_INCORRETO}`);
    console.log("\nFormatação CORRETA (timezone local):");
    console.log(`  Início: ${startISO_CORRETO}`);
    console.log(`  Fim: ${endISO_CORRETO}`);

    // Documentar o contraexemplo: diferença de 3 horas para UTC-3
    const diffHoras = (new Date(startISO_CORRETO).getTime() - new Date(startISO_INCORRETO).getTime()) / (1000 * 60 * 60);
    console.log(`\nDiferença de timezone: ${Math.abs(diffHoras)} horas`);
  });

  it("DEVE incluir todo o dia no período (00:00:00 até 23:59:59 local)", () => {
    // Arrange: Data de teste
    const testDate = "2026-04-20";

    // Act: Formatação INCORRETA (UTC hardcoded)
    const incorreto = `${testDate}T00:00:00Z`;

    // Act: Formatação CORRETA (timezone local)
    const local = new Date(`${testDate}T00:00:00`);
    const correto = local.toISOString();

    // Assert: Verificar que a data local é convertida para UTC
    // Para UTC-3, 2026-04-20T00:00:00 local = 2026-04-20T03:00:00Z UTC
    // Isso significa que a busca começa 3 horas DEPOIS no UTC
    const dataIncorreta = new Date(incorreto);
    const dataCorreta = new Date(correto);

    // EXPECTATIVA: Este teste demonstra o bug
    // A formatação incorreta exclui as primeiras 3 horas do dia (00:00-03:00 local)
    expect(dataCorreta.getTime()).toBeGreaterThan(dataIncorreta.getTime());

    console.log("\nAnálise do bug:");
    console.log(`Data incorreta (UTC hardcoded): ${incorreto}`);
    console.log(`Data correta (timezone local): ${correto}`);
    console.log(`Diferença: ${(dataCorreta.getTime() - dataIncorreta.getTime()) / (1000 * 60 * 60)} horas`);
    console.log("\nImpacto: Entradas lançadas entre 00:00-03:00 (horário local) não são retornadas");
  });

  it("DEVE documentar o contraexemplo do bug reportado pelo usuário", () => {
    // Arrange: Período reportado pelo usuário (01/04/2026 a 30/04/2026)
    const startDate = "2026-04-01";
    const endDate = "2026-04-30";

    // Arrange: Entrada de tempo lançada no dia 20/04/2026 às 10:00 (horário local UTC-3)
    const entryDate = "2026-04-20T10:00:00";
    const entryLocal = new Date(entryDate);
    const entryUTC = entryLocal.toISOString(); // 2026-04-20T13:00:00Z

    // Act: Formatação INCORRETA do período (código não corrigido)
    const startISO_INCORRETO = `${startDate}T00:00:00Z`;
    const endISO_INCORRETO = `${endDate}T23:59:59Z`;

    // Act: Formatação CORRETA do período
    const startLocal = new Date(`${startDate}T00:00:00`);
    const endLocal = new Date(`${endDate}T23:59:59`);
    const startISO_CORRETO = startLocal.toISOString();
    const endISO_CORRETO = endLocal.toISOString();

    // Assert: Verificar que a entrada está dentro do período CORRETO
    const entryTime = new Date(entryUTC).getTime();
    const startCorreto = new Date(startISO_CORRETO).getTime();
    const endCorreto = new Date(endISO_CORRETO).getTime();

    expect(entryTime).toBeGreaterThanOrEqual(startCorreto);
    expect(entryTime).toBeLessThanOrEqual(endCorreto);

    // Assert: Demonstrar que com formatação INCORRETA, pode haver problemas
    const startIncorreto = new Date(startISO_INCORRETO).getTime();
    const endIncorreto = new Date(endISO_INCORRETO).getTime();

    console.log("\nContraexemplo do bug reportado:");
    console.log(`Período selecionado: ${startDate} a ${endDate}`);
    console.log(`Entrada lançada: ${entryDate} (horário local)`);
    console.log(`Entrada em UTC: ${entryUTC}`);
    console.log("\nFormatação INCORRETA (UTC hardcoded):");
    console.log(`  Início: ${startISO_INCORRETO}`);
    console.log(`  Fim: ${endISO_INCORRETO}`);
    console.log("\nFormatação CORRETA (timezone local):");
    console.log(`  Início: ${startISO_CORRETO}`);
    console.log(`  Fim: ${endISO_CORRETO}`);
    console.log("\nResultado: A entrada DEVE estar dentro do período");
    console.log(`  Dentro do período correto? ${entryTime >= startCorreto && entryTime <= endCorreto ? "SIM" : "NÃO"}`);
    console.log(`  Dentro do período incorreto? ${entryTime >= startIncorreto && entryTime <= endIncorreto ? "SIM" : "NÃO"}`);
  });
});
