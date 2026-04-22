// Testes de Preservação - Garantir que funcionalidades existentes não sejam afetadas
// Estes testes DEVEM PASSAR no código não corrigido E no código corrigido

import { describe, it, expect } from "vitest";
import { 
  corCelula, 
  numeroSemanaISO, 
  intervaloSemanaISO,
  badgeClass, 
  fmt, 
  fmtHoras, 
  fmtData, 
  fmtDataLonga, 
  trunc, 
  iniciais 
} from "@/app/lib/utils";

// ─── Preservação: Funcionalidade do Heatmap ────────────────────────────────────

describe("Preservação: Funcionalidade do Heatmap", () => {
  /**
   * **Validates: Requirements 3.1**
   * 
   * Property 2: Preservation - Células, Cores e Percentuais Inalterados
   * 
   * Para qualquer entrada não afetada pelos bugs,
   * o código corrigido DEVE produzir o mesmo resultado.
   */
  it("corCelula deve retornar cores corretas baseadas no percentual", () => {
    // Sem dados (0 horas)
    expect(corCelula(0, 40)).toEqual({ bg: "#D3D1C7", fg: "#5F5E5A" });
    
    // Vermelho (≤ 50%)
    expect(corCelula(20, 40)).toEqual({ bg: "#E24B4A", fg: "#FFFFFF" });
    expect(corCelula(10, 40)).toEqual({ bg: "#E24B4A", fg: "#FFFFFF" });
    
    // Amarelo (> 50% e ≤ 80%)
    expect(corCelula(25, 40)).toEqual({ bg: "#EF9F27", fg: "#FFFFFF" });
    expect(corCelula(32, 40)).toEqual({ bg: "#EF9F27", fg: "#FFFFFF" });
    
    // Verde (> 80%)
    expect(corCelula(35, 40)).toEqual({ bg: "#3B6D11", fg: "#FFFFFF" });
    expect(corCelula(40, 40)).toEqual({ bg: "#3B6D11", fg: "#FFFFFF" });
    
    console.log("✓ PRESERVAÇÃO: corCelula funciona corretamente");
  });

  it("badgeClass deve retornar classes CSS corretas", () => {
    expect(badgeClass(95)).toBe("cv-badge green");
    expect(badgeClass(85)).toBe("cv-badge green");
    expect(badgeClass(75)).toBe("cv-badge yellow");
    expect(badgeClass(60)).toBe("cv-badge yellow");
    expect(badgeClass(45)).toBe("cv-badge red");
    expect(badgeClass(20)).toBe("cv-badge red");
    
    console.log("✓ PRESERVAÇÃO: badgeClass funciona corretamente");
  });
});

// ─── Preservação: Formatação de Dados ──────────────────────────────────────────

describe("Preservação: Formatação de Dados", () => {
  /**
   * **Validates: Requirements 3.4, 3.5**
   * 
   * Property 2: Preservation - Formatação Inalterada
   */
  it("fmt deve formatar números com 1 casa decimal", () => {
    expect(fmt(10)).toBe("10.0");
    expect(fmt(10.5)).toBe("10.5");
    expect(fmt(10.123)).toBe("10.1");
    expect(fmt(0)).toBe("0.0");
    
    console.log("✓ PRESERVAÇÃO: fmt funciona corretamente");
  });

  it("fmtData deve formatar datas YYYY-MM-DD para DD/MM", () => {
    expect(fmtData("2025-01-15")).toBe("15/01");
    expect(fmtData("2025-12-31")).toBe("31/12");
    expect(fmtData("2025-03-05")).toBe("05/03");
    
    console.log("✓ PRESERVAÇÃO: fmtData funciona corretamente");
  });

  it("fmtDataLonga deve formatar datas para 'DD de MMM'", () => {
    expect(fmtDataLonga("2025-01-15")).toBe("15 de jan");
    expect(fmtDataLonga("2025-12-31")).toBe("31 de dez");
    expect(fmtDataLonga("2025-06-10")).toBe("10 de jun");
    
    console.log("✓ PRESERVAÇÃO: fmtDataLonga funciona corretamente");
  });

  it("trunc deve truncar strings longas com reticências", () => {
    expect(trunc("Texto curto", 20)).toBe("Texto curto");
    // trunc trunca em n-1 caracteres + reticências
    expect(trunc("Texto muito longo que precisa ser truncado", 20)).toBe("Texto muito longo q…");
    expect(trunc("ABC", 5)).toBe("ABC");
    
    console.log("✓ PRESERVAÇÃO: trunc funciona corretamente");
  });

  it("iniciais deve retornar iniciais do nome", () => {
    expect(iniciais("Leomyr Sângelo")).toBe("LS");
    expect(iniciais("Cristina Oliveira")).toBe("CO");
    expect(iniciais("João")).toBe("JO");
    expect(iniciais("Maria da Silva Santos")).toBe("MS");
    
    console.log("✓ PRESERVAÇÃO: iniciais funciona corretamente");
  });
});

// ─── Preservação: Cálculo de Semanas ISO 8601 ──────────────────────────────────

describe("Preservação: Cálculo de Semanas ISO 8601", () => {
  /**
   * **Validates: Requirements 3.6, 3.8**
   * 
   * Property 2: Preservation - Cálculo de Semanas Inalterado
   */
  it("numeroSemanaISO deve calcular número da semana corretamente", () => {
    // Semana 1 de 2025 começa em 30/12/2024
    expect(numeroSemanaISO("2025-01-01")).toBe(1);
    expect(numeroSemanaISO("2025-01-06")).toBe(2);
    expect(numeroSemanaISO("2025-01-13")).toBe(3);
    expect(numeroSemanaISO("2025-01-20")).toBe(4);
    
    console.log("✓ PRESERVAÇÃO: numeroSemanaISO funciona corretamente");
  });

  it("intervaloSemanaISO deve retornar início e fim da semana", () => {
    // Semana de 15/01/2025 (quarta-feira)
    // Deve retornar segunda (13/01) a domingo (19/01)
    const intervalo1 = intervaloSemanaISO("2025-01-15");
    expect(intervalo1.inicio).toBe("2025-01-13");
    expect(intervalo1.fim).toBe("2025-01-19");
    
    // Semana de 20/01/2025 (segunda-feira)
    // Deve retornar segunda (20/01) a domingo (26/01)
    const intervalo2 = intervaloSemanaISO("2025-01-20");
    expect(intervalo2.inicio).toBe("2025-01-20");
    expect(intervalo2.fim).toBe("2025-01-26");
    
    console.log("✓ PRESERVAÇÃO: intervaloSemanaISO funciona corretamente");
  });
});

// ─── Preservação: Conversão de Horas (valores >= 10) ───────────────────────────

describe("Preservação: Conversão de Horas para Valores >= 10", () => {
  /**
   * **Validates: Requirements 3.4, 3.5**
   * 
   * Property 2: Preservation - Valores >= 10 Inalterados
   * 
   * IMPORTANTE: Este teste verifica que valores >= 10 continuam funcionando
   * corretamente após a correção do Bug 4 (que afeta apenas valores < 10).
   */
  it("fmtHoras deve formatar corretamente valores >= 10", () => {
    expect(fmtHoras(10.0)).toBe("10:00");
    expect(fmtHoras(10.5)).toBe("10:30");
    expect(fmtHoras(15.25)).toBe("15:15");
    expect(fmtHoras(20.75)).toBe("20:45");
    expect(fmtHoras(40.0)).toBe("40:00");
    expect(fmtHoras(100.5)).toBe("100:30");
    
    console.log("✓ PRESERVAÇÃO: fmtHoras funciona corretamente para valores >= 10");
  });

  it("fmtHoras deve arredondar minutos corretamente", () => {
    // 10.333... horas = 10h20m (arredondado)
    expect(fmtHoras(10.333)).toBe("10:20");
    
    // 15.666... horas = 15h40m (arredondado)
    expect(fmtHoras(15.666)).toBe("15:40");
    
    console.log("✓ PRESERVAÇÃO: fmtHoras arredonda minutos corretamente");
  });
});

// ─── Preservação: Property-Based Tests ─────────────────────────────────────────

describe("Preservação: Property-Based Tests", () => {
  /**
   * Property: Para QUALQUER valor de horas >= 10,
   * o formato deve ser HH:MM com minutos sempre tendo 2 dígitos.
   */
  it("fmtHoras deve sempre retornar formato HH:MM para valores >= 10", () => {
    const valores = [10, 12.5, 15, 20.25, 25, 30.75, 35, 40, 50, 100, 200];
    
    for (const horas of valores) {
      const resultado = fmtHoras(horas);
      const partes = resultado.split(":");
      
      // Deve ter exatamente 2 partes (horas:minutos)
      expect(partes.length).toBe(2);
      
      // Minutos devem ter exatamente 2 dígitos
      expect(partes[1].length).toBe(2);
      
      // Minutos devem ser um número válido entre 00 e 59
      const minutos = parseInt(partes[1], 10);
      expect(minutos).toBeGreaterThanOrEqual(0);
      expect(minutos).toBeLessThanOrEqual(59);
    }
    
    console.log("✓ PRESERVAÇÃO: fmtHoras mantém formato HH:MM para todos os valores >= 10");
  });

  /**
   * Property: Para QUALQUER percentual, badgeClass deve retornar uma classe válida.
   */
  it("badgeClass deve retornar classes válidas para qualquer percentual", () => {
    const percentuais = [0, 10, 25, 45, 50, 55, 75, 80, 85, 95, 100, 120];
    const classesValidas = ["cv-badge red", "cv-badge yellow", "cv-badge green"];
    
    for (const pct of percentuais) {
      const resultado = badgeClass(pct);
      expect(classesValidas).toContain(resultado);
    }
    
    console.log("✓ PRESERVAÇÃO: badgeClass retorna classes válidas para todos os percentuais");
  });

  /**
   * Property: Para QUALQUER data válida, numeroSemanaISO deve retornar um número entre 1 e 53.
   */
  it("numeroSemanaISO deve retornar número válido para qualquer data", () => {
    const datas = [
      "2025-01-01", "2025-02-15", "2025-03-20", "2025-06-10",
      "2025-09-05", "2025-12-31", "2024-12-30", "2026-01-05"
    ];
    
    for (const data of datas) {
      const semana = numeroSemanaISO(data);
      expect(semana).toBeGreaterThanOrEqual(1);
      expect(semana).toBeLessThanOrEqual(53);
    }
    
    console.log("✓ PRESERVAÇÃO: numeroSemanaISO retorna números válidos para todas as datas");
  });
});
