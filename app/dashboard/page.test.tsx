// Testes exploratórios para bugs no Dashboard - Heatmap
// Bug 1: Nome do colaborador quebrado em múltiplas linhas na tabela

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PageDashboard from "./page";
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
    {
      nome: "Cristina Oliveira",
      meta: 40,
      mediaHoras: 35.0,
      mediaPct: 88,
      semanasAcima: 0,
      semanasAbaixo: 2,
      semanasAusente: 0,
      primeiraSemana: "2025-01-13",
      semanas: [
        {
          semana: "2025-01-13",
          horas: 35,
          pct: 88,
          skip: false,
          carnavalAuto: false,
          projetos: [],
          cats: {},
        },
        {
          semana: "2025-01-20",
          horas: 35,
          pct: 88,
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

// ─── Bug 1: Exploração - Nome Quebrado na Tabela ──────────────────────────────

describe("Bug 1: Exploração - Nome Quebrado na Tabela do Heatmap", () => {
  /**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * Property 1: Bug Condition - Nome em Múltiplos Elementos <div>
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * Para qualquer nome com múltiplas palavras (ex: "Leomyr Sângelo"),
   * o código bugado renderiza dois elementos <div> separados com classes
   * "cv-name-first" e "cv-name-last", causando quebra de linha.
   */
  it("DEVE FALHAR: nome 'Leomyr Sângelo' é renderizado em dois divs separados", () => {
    const { container } = render(<PageDashboard />);
    
    // Procura pelos elementos com classes específicas que causam o bug
    const firstNameDivs = container.querySelectorAll(".cv-name-first");
    const lastNameDivs = container.querySelectorAll(".cv-name-last");
    
    // No código bugado, esperamos encontrar esses elementos
    // Este teste FALHA quando o bug é corrigido (elementos não existem mais)
    expect(firstNameDivs.length).toBeGreaterThan(0);
    expect(lastNameDivs.length).toBeGreaterThan(0);
    
    // Verifica que "Leomyr" está em um div e "Sângelo" em outro
    const leomyrDiv = Array.from(firstNameDivs).find(
      (el) => el.textContent === "Leomyr"
    );
    expect(leomyrDiv).toBeDefined();
    
    const sangeloDiv = Array.from(lastNameDivs).find(
      (el) => el.textContent?.includes("Sângelo")
    );
    expect(sangeloDiv).toBeDefined();
  });

  /**
   * Teste com outro nome para confirmar o padrão
   */
  it("DEVE FALHAR: nome 'Cristina Oliveira' é renderizado em dois divs separados", () => {
    const { container } = render(<PageDashboard />);
    
    const firstNameDivs = container.querySelectorAll(".cv-name-first");
    const lastNameDivs = container.querySelectorAll(".cv-name-last");
    
    // Verifica que "Cristina" está em um div
    const cristinaDiv = Array.from(firstNameDivs).find(
      (el) => el.textContent === "Cristina"
    );
    expect(cristinaDiv).toBeDefined();
    
    // Verifica que "Oliveira" está em outro div
    const oliveiraDiv = Array.from(lastNameDivs).find(
      (el) => el.textContent?.includes("Oliveira")
    );
    expect(oliveiraDiv).toBeDefined();
  });
});
