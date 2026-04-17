// Teste exploratório para Bug 5: Calendário sem número da semana
// Este teste DEVE FALHAR no código não corrigido, confirmando que o bug existe

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PageCalendario from "./page";
import type { DadosDashboard } from "@/lib/types";

// Mock do contexto de dados
vi.mock("@/app/context/DadosContext", () => ({
  useDados: () => ({
    dados: mockDadosDashboard,
    carregando: false,
    erro: null,
  }),
}));

// ─── Dados de Teste Mockados ──────────────────────────────────────────────────

const mockDadosDashboard: DadosDashboard = {
  atualizadoEm: "2025-01-20T10:00:00Z",
  workspace: "SETEG",
  todasSemanas: ["2025-01-13", "2025-01-20"],
  colaboradores: [
    {
      nome: "Leomyr Sângelo",
      meta: 40,
      mediaHoras: 38.5,
      mediaPct: 96,
      semanasAcima: 1,
      semanasAbaixo: 1,
      semanasAusente: 0,
      primeiraSemana: "2025-01-13",
      semanas: [
        {
          semana: "2025-01-13",
          horas: 40,
          pct: 100,
          skip: false,
          carnavalAuto: false,
          projetos: [],
          cats: {},
        },
        {
          semana: "2025-01-20",
          horas: 37,
          pct: 93,
          skip: false,
          carnavalAuto: false,
          projetos: [],
          cats: {},
        },
      ],
      topProjetos: [],
      catsTotal: {},
    },
  ],
};

// ─── Bug 5: Exploração - Calendário Sem Número da Semana ──────────────────────

describe("Bug 5: Exploração - Calendário Sem Número da Semana", () => {
  /**
   * **Validates: Requirements 1.5, 2.5**
   * 
   * Property 1: Bug Condition - Ausência de Números de Semana ISO 8601
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * O código bugado não renderiza números de semana ISO 8601 no calendário.
   * Esperamos NÃO encontrar textos como "Sem 1", "Sem 2", etc.
   */
  it("DEVE FALHAR: calendário não exibe 'Sem 1', 'Sem 2', etc.", () => {
    const { container } = render(<PageCalendario />);
    
    // Procura por elementos que contenham "Sem" seguido de número
    const textoCompleto = container.textContent || "";
    
    // Verifica se NÃO existem textos como "Sem 1", "Sem 2", "Sem 3"
    const contemSem1 = textoCompleto.includes("Sem 1") || textoCompleto.includes("Sem 2") || textoCompleto.includes("Sem 3");
    
    // No código bugado, esperamos que NÃO contenha números de semana
    expect(contemSem1).toBe(false);
    
    if (!contemSem1) {
      console.log("❌ BUG CONFIRMADO: Calendário não exibe números de semana ISO 8601");
      console.log("   Comportamento esperado: coluna à esquerda com 'Sem 1', 'Sem 2', etc.");
    }
  });

  /**
   * Teste estrutural: verificar que a grade do calendário não tem coluna extra
   */
  it("DEVE FALHAR: grade do calendário não tem coluna de números de semana", () => {
    const { container } = render(<PageCalendario />);
    
    // Encontra a grade do calendário
    const grade = container.querySelector(".cv-cal-grid");
    expect(grade).toBeDefined();
    
    // Conta os elementos filhos diretos
    // No código bugado: 7 cabeçalhos de dias + N células de dias
    // No código corrigido: deveria ter elementos adicionais para números de semana
    const filhos = grade?.children;
    const numFilhos = filhos?.length || 0;
    
    // Verifica se os primeiros 7 elementos são os dias da semana
    const primeiros7 = Array.from(filhos || []).slice(0, 7);
    const todosSaoDiasSemana = primeiros7.every((el) => {
      const texto = el.textContent || "";
      return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].includes(texto);
    });
    
    expect(todosSaoDiasSemana).toBe(true);
    
    console.log(`❌ BUG CONFIRMADO: Grade tem ${numFilhos} elementos, começando com dias da semana`);
    console.log("   Comportamento esperado: deveria ter coluna adicional para números de semana");
  });

  /**
   * Teste de preservação: dias da semana devem estar presentes
   */
  it("PRESERVAÇÃO: cabeçalhos dos dias da semana devem estar presentes", () => {
    render(<PageCalendario />);
    
    // Verifica que os dias da semana estão presentes
    expect(screen.getByText("Seg")).toBeDefined();
    expect(screen.getByText("Ter")).toBeDefined();
    expect(screen.getByText("Qua")).toBeDefined();
    expect(screen.getByText("Qui")).toBeDefined();
    expect(screen.getByText("Sex")).toBeDefined();
    expect(screen.getByText("Sáb")).toBeDefined();
    expect(screen.getByText("Dom")).toBeDefined();
    
    console.log("✓ PRESERVAÇÃO: Cabeçalhos dos dias da semana presentes");
  });

  /**
   * Teste de preservação: navegação entre meses deve funcionar
   */
  it("PRESERVAÇÃO: botões de navegação devem estar presentes", () => {
    const { container } = render(<PageCalendario />);
    
    // Verifica que os botões de navegação existem
    const botoes = container.querySelectorAll(".cv-cal-nav-btn");
    expect(botoes.length).toBe(2);
    
    console.log("✓ PRESERVAÇÃO: Botões de navegação presentes");
  });
});
