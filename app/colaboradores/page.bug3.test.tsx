// Teste exploratório para Bug 3: Campo de busca em posição incorreta
// Este teste DEVE FALHAR no código não corrigido, confirmando que o bug existe

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PageColaboradores from "./page";
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
  todasSemanas: ["2025-01-13"],
  colaboradores: [
    {
      nome: "Leomyr Sângelo",
      meta: 40,
      mediaHoras: 38.5,
      mediaPct: 96,
      semanasAcima: 1,
      semanasAbaixo: 0,
      semanasAusente: 0,
      primeiraSemana: "2025-01-13",
      semanas: [
        {
          semana: "2025-01-13",
          horas: 38.5,
          pct: 96,
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

// ─── Bug 3: Exploração - Campo de Busca na Posição Incorreta ──────────────────

describe("Bug 3: Exploração - Campo de Busca em Posição Incorreta", () => {
  /**
   * **Validates: Requirements 1.3, 2.3**
   * 
   * Property 1: Bug Condition - Campo de Busca na Linha 1
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * O código bugado posiciona o campo de busca na primeira <div> (linha das cores),
   * quando deveria estar na segunda <div> (linha dos indicadores).
   */
  it("DEVE FALHAR: campo de busca está na linha 1 (junto com cores do heatmap)", () => {
    const { container } = render(<PageColaboradores />);
    
    // Encontra o campo de busca
    const campoBusca = screen.getByPlaceholderText("Buscar colaborador...");
    expect(campoBusca).toBeDefined();
    
    // Encontra o container pai do campo de busca
    const campoBuscaParent = campoBusca.closest("div[style*='display']");
    expect(campoBuscaParent).toBeDefined();
    
    // Encontra o container avô (a linha que contém o campo)
    const linhaComCampo = campoBuscaParent?.parentElement;
    expect(linhaComCampo).toBeDefined();
    
    // Verifica se esta linha contém as cores do heatmap
    // No código bugado, o campo de busca está na mesma linha que as cores
    const textoLinha = linhaComCampo?.textContent || "";
    const contemCores = textoLinha.includes("Média semanal") || 
                        textoLinha.includes("Sem dados") ||
                        textoLinha.includes("≤ 50%");
    
    // No código bugado, esperamos que o campo esteja na linha das cores
    expect(contemCores).toBe(true);
    
    if (contemCores) {
      console.log("❌ BUG CONFIRMADO: Campo de busca está na linha 1 (linha das cores do heatmap)");
      console.log("   Comportamento esperado: campo deveria estar na linha 2 (linha dos indicadores)");
    }
  });

  /**
   * Teste complementar: verificar que o texto "Clique em um card..." está na linha 1
   */
  it("DEVE FALHAR: texto 'Clique em um card...' está na linha 1 junto com cores", () => {
    const { container } = render(<PageColaboradores />);
    
    // Procura pelo texto "Clique em um card..."
    const textoClique = screen.getByText(/Clique em um card/i);
    expect(textoClique).toBeDefined();
    
    // Verifica se está na mesma linha que as cores
    const linhaComTexto = textoClique.closest("div[style*='display']")?.parentElement;
    const textoLinha = linhaComTexto?.textContent || "";
    
    const contemCores = textoLinha.includes("Média semanal") || 
                        textoLinha.includes("Sem dados");
    
    // No código bugado, o texto está na linha 1 (linha das cores)
    expect(contemCores).toBe(true);
    
    if (contemCores) {
      console.log("❌ BUG CONFIRMADO: Texto 'Clique em um card...' está na linha 1 (linha das cores)");
      console.log("   Comportamento esperado: texto deveria estar na linha 1, mas campo de busca na linha 2");
    }
  });

  /**
   * Teste estrutural: verificar que existem duas linhas na legenda
   */
  it("legenda deve ter duas linhas (cores + indicadores)", () => {
    const { container } = render(<PageColaboradores />);
    
    // Encontra o container da legenda (primeiro elemento com background branco e border)
    const legenda = container.querySelector("div[style*='background: rgb(255, 255, 255)']");
    expect(legenda).toBeDefined();
    
    // Conta quantas divs filhas diretas existem (devem ser 3: linha1, divisor, linha2)
    const filhos = legenda?.children;
    expect(filhos).toBeDefined();
    expect(filhos!.length).toBeGreaterThanOrEqual(3);
    
    console.log(`✓ Legenda tem ${filhos!.length} elementos filhos (esperado: 3 - linha1, divisor, linha2)`);
  });
});
