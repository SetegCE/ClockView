// Testes de exploração e correção de bugs no componente PainelDetalhes
// Bug 1: Nome do colaborador aparece separado em linhas diferentes

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PainelDetalhes from "./PainelDetalhes";
import type { Colaborador } from "@/lib/types";

// ─── Dados de Teste Mockados ──────────────────────────────────────────────────

const mockColaborador: Colaborador = {
  nome: "Leomyr Sângelo",
  meta: 40,
  mediaHoras: 38.5,
  mediaPct: 96,
  semanasAcima: 10,
  semanasAbaixo: 2,
  semanasAusente: 0,
  primeiraSemana: "2025-01-01",
  semanas: [
    {
      semana: "2025-01-13",
      horas: 40,
      pct: 100,
      skip: false,
      carnavalAuto: false,
      projetos: [
        {
          nome: "Projeto A",
          horas: 40,
          top3: [
            { desc: "Trabalho em campo", horas: 20 },
            { desc: "Relatório", horas: 15 },
            { desc: "Reunião", horas: 5 },
          ],
        },
      ],
      cats: {
        campo: 20,
        escritorio: 15,
        reuniao: 5,
      },
    },
  ],
  topProjetos: [
    {
      nome: "Projeto A",
      horas: 40,
      top3: [
        { desc: "Trabalho em campo", horas: 20 },
        { desc: "Relatório", horas: 15 },
        { desc: "Reunião", horas: 5 },
      ],
    },
  ],
  catsTotal: {
    campo: 20,
    escritorio: 15,
    reuniao: 5,
  },
};

// ─── Bug 1: Exploração - Nome Separado ────────────────────────────────────────

describe("Bug 1: Exploração - Nome Separado", () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
   * 
   * Property 1: Bug Condition - Nome do Colaborador em Múltiplas Linhas
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * Para qualquer nome de colaborador (ex: "Leomyr Sângelo"),
   * o componente DEVE renderizar o nome em uma única linha sem quebras.
   */
  it("nome do colaborador deve aparecer em uma única linha - caso Leomyr", () => {
    const mockOnFechar = () => {};
    
    const { container } = render(
      <PainelDetalhes
        colaborador={mockColaborador}
        semana={null}
        onFechar={mockOnFechar}
      />
    );
    
    // Encontra o elemento que contém o nome
    const nomeElement = screen.getByText("Leomyr Sângelo");
    expect(nomeElement).toBeDefined();
    
    // Verifica que o elemento tem whiteSpace: nowrap
    const computedStyle = window.getComputedStyle(nomeElement);
    expect(computedStyle.whiteSpace).toBe("nowrap");
    
    // Verifica que o texto não está quebrado
    const textContent = nomeElement.textContent;
    expect(textContent).toBe("Leomyr Sângelo");
    
    // Verifica que não há elementos filhos que possam causar quebra
    expect(nomeElement.children.length).toBe(0);
  });

  /**
   * Teste com nomes de diferentes tamanhos
   */
  it("nomes longos devem aparecer em uma única linha com ellipsis", () => {
    const colaboradorNomeLongo: Colaborador = {
      ...mockColaborador,
      nome: "Maria Fernanda dos Santos Silva",
    };
    
    const mockOnFechar = () => {};
    
    render(
      <PainelDetalhes
        colaborador={colaboradorNomeLongo}
        semana={null}
        onFechar={mockOnFechar}
      />
    );
    
    const nomeElement = screen.getByText("Maria Fernanda dos Santos Silva");
    expect(nomeElement).toBeDefined();
    
    // Verifica estilo
    const computedStyle = window.getComputedStyle(nomeElement);
    expect(computedStyle.whiteSpace).toBe("nowrap");
    expect(computedStyle.overflow).toBe("hidden");
    expect(computedStyle.textOverflow).toBe("ellipsis");
  });
});

// ─── Bug 1: Preservação - Formatação Visual Inalterada ────────────────────────

describe("Bug 1: Preservação - Formatação Visual Inalterada", () => {
  /**
   * **Validates: Requirements 3.5**
   * 
   * Property 2: Preservation - Formatação Visual Inalterada
   * 
   * Para qualquer renderização do painel de detalhes,
   * o código corrigido DEVE manter a mesma formatação visual.
   */
  it("formatação visual do nome deve ser preservada", () => {
    const mockOnFechar = () => {};
    
    render(
      <PainelDetalhes
        colaborador={mockColaborador}
        semana={null}
        onFechar={mockOnFechar}
      />
    );
    
    const nomeElement = screen.getByText("Leomyr Sângelo");
    const computedStyle = window.getComputedStyle(nomeElement);
    
    // Verifica cor, peso e tamanho
    expect(computedStyle.fontSize).toBe("16px");
    expect(computedStyle.fontWeight).toBe("700");
    expect(computedStyle.color).toBe("rgb(30, 41, 59)"); // #1e293b
  });

  /**
   * Outros elementos do painel devem renderizar corretamente
   */
  it("categorias e projetos devem renderizar corretamente", () => {
    const mockOnFechar = () => {};
    
    render(
      <PainelDetalhes
        colaborador={mockColaborador}
        semana={null}
        onFechar={mockOnFechar}
      />
    );
    
    // Verifica que categorias estão presentes
    expect(screen.getByText("Categorias")).toBeDefined();
    
    // Verifica que projetos estão presentes
    expect(screen.getByText("Projetos")).toBeDefined();
    expect(screen.getByText("Projeto A")).toBeDefined();
  });
});
