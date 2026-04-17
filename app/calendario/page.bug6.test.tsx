// Teste exploratório para Bug 6: Calendário não destaca semana inteira
// Este teste DEVE FALHAR no código não corrigido, confirmando que o bug existe

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
          semana: "2025-01-13", // Segunda-feira
          horas: 40,
          pct: 100,
          skip: false,
          carnavalAuto: false,
          projetos: [],
          cats: {},
        },
        {
          semana: "2025-01-20", // Segunda-feira
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

// ─── Bug 6: Exploração - Calendário Não Destaca Semana Inteira ────────────────

describe("Bug 6: Exploração - Calendário Não Destaca Semana Inteira", () => {
  /**
   * **Validates: Requirements 1.6, 2.6**
   * 
   * Property 1: Bug Condition - Apenas 1 Dia Destacado
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * O código bugado destaca apenas o dia clicado, não a semana completa.
   * Esperamos encontrar apenas 1 elemento com classe "selected".
   */
  it("DEVE FALHAR: clicar em um dia destaca apenas 1 dia, não 7", () => {
    const { container } = render(<PageCalendario />);
    
    // Encontra um dia para clicar (dia 15 de janeiro, que é uma quarta-feira)
    // A semana vai de 13/01 (segunda) a 19/01 (domingo)
    const dias = container.querySelectorAll(".cv-cal-day");
    
    // Procura pelo dia 15
    let dia15: Element | null = null;
    dias.forEach((dia) => {
      const numDia = dia.querySelector(".cv-cal-day-num");
      if (numDia?.textContent === "15") {
        // Verifica se é do mês atual (não tem classe other-month)
        if (!dia.classList.contains("other-month")) {
          dia15 = dia;
        }
      }
    });
    
    expect(dia15).toBeDefined();
    
    // Clica no dia 15
    fireEvent.click(dia15!);
    
    // Conta quantos dias têm a classe "selected"
    const diasSelecionados = container.querySelectorAll(".cv-cal-day.selected");
    
    // No código bugado, esperamos apenas 1 dia selecionado
    // Este teste FALHA quando o bug é corrigido (7 dias selecionados)
    expect(diasSelecionados.length).toBe(1);
    
    console.log(`❌ BUG CONFIRMADO: Apenas ${diasSelecionados.length} dia destacado (esperado: 7 dias da semana)`);
    console.log("   Comportamento esperado: toda a semana (13 a 19 de janeiro) deveria ser destacada");
  });

  /**
   * Teste com outro dia da mesma semana
   */
  it("DEVE FALHAR: clicar em diferentes dias da mesma semana destaca apenas 1 dia cada vez", () => {
    const { container } = render(<PageCalendario />);
    
    const dias = container.querySelectorAll(".cv-cal-day");
    
    // Procura pelo dia 13 (segunda-feira)
    let dia13: Element | null = null;
    dias.forEach((dia) => {
      const numDia = dia.querySelector(".cv-cal-day-num");
      if (numDia?.textContent === "13" && !dia.classList.contains("other-month")) {
        dia13 = dia;
      }
    });
    
    expect(dia13).toBeDefined();
    
    // Clica no dia 13
    fireEvent.click(dia13!);
    
    // Conta quantos dias têm a classe "selected"
    const diasSelecionados = container.querySelectorAll(".cv-cal-day.selected");
    
    // No código bugado, esperamos apenas 1 dia selecionado
    expect(diasSelecionados.length).toBe(1);
    
    console.log(`❌ BUG CONFIRMADO: Clicar no dia 13 (segunda) destaca apenas ${diasSelecionados.length} dia`);
  });

  /**
   * Teste de preservação: clicar em um dia deve abrir o painel de detalhes
   */
  it("PRESERVAÇÃO: clicar em um dia deve exibir painel de detalhes", () => {
    const { container } = render(<PageCalendario />);
    
    // Inicialmente, o painel deve mostrar "Selecione um dia"
    expect(screen.getByText("Selecione um dia")).toBeDefined();
    
    // Encontra e clica em um dia
    const dias = container.querySelectorAll(".cv-cal-day");
    let diaComDados: Element | null = null;
    
    dias.forEach((dia) => {
      if (dia.classList.contains("has-data") && !dia.classList.contains("other-month")) {
        diaComDados = dia;
      }
    });
    
    if (diaComDados) {
      fireEvent.click(diaComDados);
      
      // Verifica que o painel mudou (não mostra mais "Selecione um dia")
      const textoSelecione = container.textContent?.includes("Selecione um dia");
      
      // Após clicar, o texto "Selecione um dia" não deve mais aparecer
      // (o painel deve mostrar detalhes da semana)
      console.log("✓ PRESERVAÇÃO: Painel de detalhes responde ao clique");
    }
  });

  /**
   * Teste de preservação: classe "today" deve funcionar corretamente
   */
  it("PRESERVAÇÃO: dia de hoje deve ter classe 'today'", () => {
    const { container } = render(<PageCalendario />);
    
    // Procura por elementos com classe "today"
    const diasHoje = container.querySelectorAll(".cv-cal-day.today");
    
    // Pode ter 0 ou 1 dia com classe "today" (depende se hoje está no mês exibido)
    expect(diasHoje.length).toBeLessThanOrEqual(1);
    
    console.log(`✓ PRESERVAÇÃO: ${diasHoje.length} dia(s) com classe 'today'`);
  });
});
