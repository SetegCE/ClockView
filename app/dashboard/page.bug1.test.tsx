/**
 * Teste Exploratório - Bug 1: Nome do Colaborador Quebrado
 * 
 * ANÁLISE: O código atual JÁ ESTÁ CORRETO - usa cv-name-full em uma única linha.
 * O bug descrito no design document (cv-name-first e cv-name-last) não existe.
 * 
 * CONCLUSÃO: Bug 1 já foi corrigido anteriormente. Teste valida comportamento correto.
 * 
 * **Validates: Requirements 2.1**
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import PageDashboard from "./page";

// Mock do contexto de dados
const mockDados = {
  colaboradores: [
    {
      nome: "Leomyr Sângelo",
      meta: 40,
      mediaPct: 95,
      mediaHoras: 38,
      semanas: [
        {
          semana: "2025-01-06",
          horas: 38,
          pct: 95,
          skip: false,
          carnavalAuto: false,
        },
      ],
    },
    {
      nome: "Cristina Oliveira",
      meta: 40,
      mediaPct: 90,
      mediaHoras: 36,
      semanas: [
        {
          semana: "2025-01-06",
          horas: 36,
          pct: 90,
          skip: false,
          carnavalAuto: false,
        },
      ],
    },
  ],
  todasSemanas: ["2025-01-06"],
};

// Mock do hook useDados
vi.mock("@/app/context/DadosContext", () => ({
  useDados: () => ({
    dados: mockDados,
    carregando: false,
    erro: null,
  }),
  DadosProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Bug 1: Nome do Colaborador - Validação de Comportamento Correto", () => {
  it("deve exibir nomes completos em uma única linha (comportamento correto)", () => {
    const { container } = render(<PageDashboard />);

    // Verificar que NÃO existem classes cv-name-first e cv-name-last (bug corrigido)
    const firstNameDivs = container.querySelectorAll(".cv-name-first");
    const lastNameDivs = container.querySelectorAll(".cv-name-last");
    expect(firstNameDivs.length).toBe(0);
    expect(lastNameDivs.length).toBe(0);

    // Verificar que existe cv-name-full (comportamento correto)
    const fullNameDivs = container.querySelectorAll(".cv-name-full");
    expect(fullNameDivs.length).toBeGreaterThan(0);

    // Verificar que nomes completos estão presentes
    const nomes = Array.from(fullNameDivs).map((div) => div.textContent);
    expect(nomes).toContain("Leomyr Sângelo");
    expect(nomes).toContain("Cristina Oliveira");
  });

});
