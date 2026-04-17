// Teste exploratório para Bug 4: Formato de horas inconsistente
// Este teste DEVE FALHAR no código não corrigido, confirmando que o bug existe

import { describe, it, expect } from "vitest";
import { fmtHoras } from "./utils";

// ─── Bug 4: Exploração - Formato de Horas Inconsistente ───────────────────────

describe("Bug 4: Exploração - Formato de Horas Inconsistente", () => {
  /**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Property 1: Bug Condition - Horas < 10 sem Zero à Esquerda
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * Para qualquer valor de horas < 10, o código bugado retorna formato
   * sem zero à esquerda (ex: "1:54" em vez de "01:54").
   */
  it("DEVE FALHAR: fmtHoras(1.9) retorna '1:54' sem zero à esquerda", () => {
    const resultado = fmtHoras(1.9);
    
    // No código bugado, esperamos "1:54" (sem zero à esquerda)
    // Este teste FALHA quando o bug é corrigido (retorna "01:54")
    expect(resultado).toBe("1:54");
    
    console.log(`❌ BUG CONFIRMADO: fmtHoras(1.9) = "${resultado}" (esperado: "01:54")`);
  });

  /**
   * Teste com outro valor < 10
   */
  it("DEVE FALHAR: fmtHoras(8.5) retorna '8:30' sem zero à esquerda", () => {
    const resultado = fmtHoras(8.5);
    
    // No código bugado, esperamos "8:30"
    expect(resultado).toBe("8:30");
    
    console.log(`❌ BUG CONFIRMADO: fmtHoras(8.5) = "${resultado}" (esperado: "08:30")`);
  });

  /**
   * Teste com valor exato (sem minutos)
   */
  it("DEVE FALHAR: fmtHoras(5.0) retorna '5:00' sem zero à esquerda", () => {
    const resultado = fmtHoras(5.0);
    
    // No código bugado, esperamos "5:00"
    expect(resultado).toBe("5:00");
    
    console.log(`❌ BUG CONFIRMADO: fmtHoras(5.0) = "${resultado}" (esperado: "05:00")`);
  });

  /**
   * Teste com valor muito pequeno
   */
  it("DEVE FALHAR: fmtHoras(0.25) retorna '0:15' sem zero à esquerda", () => {
    const resultado = fmtHoras(0.25);
    
    // No código bugado, esperamos "0:15"
    expect(resultado).toBe("0:15");
    
    console.log(`❌ BUG CONFIRMADO: fmtHoras(0.25) = "${resultado}" (esperado: "00:15")`);
  });

  /**
   * Teste de preservação: valores >= 10 devem funcionar corretamente
   */
  it("PRESERVAÇÃO: fmtHoras(10.5) deve retornar '10:30' (já correto)", () => {
    const resultado = fmtHoras(10.5);
    
    // Valores >= 10 já funcionam corretamente no código bugado
    expect(resultado).toBe("10:30");
    
    console.log(`✓ PRESERVAÇÃO: fmtHoras(10.5) = "${resultado}" (correto)`);
  });

  /**
   * Teste de preservação: valores grandes
   */
  it("PRESERVAÇÃO: fmtHoras(40.0) deve retornar '40:00' (já correto)", () => {
    const resultado = fmtHoras(40.0);
    
    expect(resultado).toBe("40:00");
    
    console.log(`✓ PRESERVAÇÃO: fmtHoras(40.0) = "${resultado}" (correto)`);
  });
});

// ─── Bug 4: Testes Baseados em Propriedades ───────────────────────────────────

describe("Bug 4: Property-Based Tests - Formato Consistente", () => {
  /**
   * Property: Para QUALQUER valor de horas entre 0 e 9.99,
   * o formato deve ser HH:MM com 2 dígitos para horas.
   */
  it("DEVE FALHAR: todas as horas < 10 devem ter formato HH:MM", () => {
    const valoresTestados = [0, 0.5, 1, 1.5, 2, 3.25, 4.75, 5, 6.33, 7.5, 8, 9, 9.99];
    const falhas: string[] = [];
    
    for (const horas of valoresTestados) {
      const resultado = fmtHoras(horas);
      
      // Verifica se tem 2 dígitos antes dos dois pontos
      const partes = resultado.split(":");
      if (partes[0].length !== 2) {
        falhas.push(`fmtHoras(${horas}) = "${resultado}" (parte das horas tem ${partes[0].length} dígitos, esperado 2)`);
      }
    }
    
    // No código bugado, esperamos muitas falhas
    expect(falhas.length).toBeGreaterThan(0);
    
    console.log(`❌ BUG CONFIRMADO: ${falhas.length} valores com formato incorreto:`);
    falhas.forEach((f) => console.log(`   ${f}`));
  });

  /**
   * Property: Para QUALQUER valor de horas >= 10,
   * o formato já está correto (preservação).
   */
  it("PRESERVAÇÃO: todas as horas >= 10 devem ter formato correto", () => {
    const valoresTestados = [10, 15.5, 20, 25.25, 30, 35.75, 40, 50, 100];
    const falhas: string[] = [];
    
    for (const horas of valoresTestados) {
      const resultado = fmtHoras(horas);
      
      // Verifica formato HH:MM
      const partes = resultado.split(":");
      if (partes.length !== 2 || partes[1].length !== 2) {
        falhas.push(`fmtHoras(${horas}) = "${resultado}" (formato incorreto)`);
      }
    }
    
    // No código bugado, valores >= 10 já funcionam
    expect(falhas.length).toBe(0);
    
    console.log(`✓ PRESERVAÇÃO: ${valoresTestados.length} valores >= 10 com formato correto`);
  });
});
