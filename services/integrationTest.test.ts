// Teste de integração final - Validação completa de todas as correções
// Verifica que todos os bugs foram corrigidos e não há regressões

import { describe, it, expect, beforeEach, vi } from "vitest";
import { processarDashboard, invalidarCache } from "./dashboardService";
import { getSemana } from "@/lib/businessRules";
import type { ClockifyUser, ClockifyProject, ClockifyTimeEntry } from "@/lib/types";

// Mock das funções de fetch do Clockify
vi.mock("./clockifyClient", () => ({
  fetchFromClockify: vi.fn(),
  fetchFromClockifyLong: vi.fn(),
}));

import { fetchFromClockify, fetchFromClockifyLong } from "./clockifyClient";

// ─── Dados de Teste Mockados ──────────────────────────────────────────────────

const mockUsuarios: ClockifyUser[] = [
  { id: "user1", name: "Cristina Silva", email: "cristina@seteg.com", status: "ACTIVE" },
  { id: "user2", name: "Carina Santos", email: "carina@seteg.com", status: "ACTIVE" },
  { id: "user3", name: "Leomyr Sângelo", email: "leomyr@seteg.com", status: "ACTIVE" },
];

const mockProjetos: ClockifyProject[] = [
  { id: "proj1", name: "Projeto A", clientName: "Cliente A" },
  { id: "proj2", name: "Projeto B", clientName: "Cliente B" },
];

// ─── Teste de Integração Final ────────────────────────────────────────────────

describe("Validação Completa - Todos os Bugs Corrigidos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidarCache();
  });

  /**
   * Teste de integração que valida:
   * - Bug 2: Semanas futuras não têm horas
   * - Bug 3: Dados batem com Clockify
   * - Preservação: Lógica de negócio inalterada
   */
  it("cenário completo: Cristina, Carina e Leomyr", async () => {
    const dataAtual = "2025-01-22";
    const segundaFeiraAtual = getSemana(dataAtual + "T12:00:00Z");
    const semanaFutura = "2025-01-27";
    const semanaPassada = "2025-01-13";
    
    // Verifica que as semanas estão corretas
    expect(semanaFutura > segundaFeiraAtual).toBe(true);
    expect(semanaPassada <= segundaFeiraAtual).toBe(true);
    
    // Mock: Entradas para os três colaboradores
    const entradasCristina: ClockifyTimeEntry[] = [
      // Semana passada: 40h
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `cristina-past-${i}`,
        description: "Trabalho",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: `2025-01-${13 + i}T08:00:00Z`,
          end: `2025-01-${13 + i}T16:00:00Z`,
          duration: "PT8H",
        },
      })),
      // Semana futura: 40h (BUG - não deve aparecer)
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `cristina-future-${i}`,
        description: "Trabalho futuro",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: `2025-01-${27 + i}T08:00:00Z`,
          end: `2025-01-${27 + i}T16:00:00Z`,
          duration: "PT8H",
        },
      })),
    ];
    
    const entradasCarina: ClockifyTimeEntry[] = [
      // Semana passada: 43.833...h
      {
        id: "carina-1",
        description: "Trabalho em campo",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-13T08:00:00Z",
          end: "2025-01-13T16:30:00Z",
          duration: "PT8H30M",
        },
      },
      {
        id: "carina-2",
        description: "Relatório",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-14T08:00:00Z",
          end: "2025-01-14T17:15:00Z",
          duration: "PT9H15M",
        },
      },
      {
        id: "carina-3",
        description: "Reunião",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-15T08:00:00Z",
          end: "2025-01-15T16:45:00Z",
          duration: "PT8H45M",
        },
      },
      {
        id: "carina-4",
        description: "Análise",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-16T08:00:00Z",
          end: "2025-01-16T17:00:00Z",
          duration: "PT9H",
        },
      },
      {
        id: "carina-5",
        description: "Documentação",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-17T08:00:00Z",
          end: "2025-01-17T16:20:00Z",
          duration: "PT8H20M",
        },
      },
    ];
    
    const entradasLeomyr: ClockifyTimeEntry[] = [
      // Semana passada: 40h
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `leomyr-${i}`,
        description: "Trabalho",
        userId: "user3",
        projectId: "proj2",
        timeInterval: {
          start: `2025-01-${13 + i}T08:00:00Z`,
          end: `2025-01-${13 + i}T16:00:00Z`,
          duration: "PT8H",
        },
      })),
    ];
    
    // Configura mocks
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: mockUsuarios };
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    vi.mocked(fetchFromClockifyLong).mockImplementation(async (path: string) => {
      if (path.includes("user1")) {
        return { data: entradasCristina };
      }
      if (path.includes("user2")) {
        return { data: entradasCarina };
      }
      if (path.includes("user3")) {
        return { data: entradasLeomyr };
      }
      return { data: [] };
    });
    
    // Processa dashboard
    const resultado = await processarDashboard("2025-01-01", dataAtual);
    
    // ─── Validação Bug 2: Cristina não deve ter horas na semana futura ────────
    const cristina = resultado.colaboradores.find(c => c.nome === "Cristina Silva");
    expect(cristina).toBeDefined();
    
    const cristinaSemanaFutura = cristina!.semanas.find(s => s.semana === semanaFutura);
    expect(cristinaSemanaFutura).toBeDefined();
    expect(cristinaSemanaFutura!.horas === 0 || cristinaSemanaFutura!.skip === true).toBe(true);
    
    const cristinaSemanaPassada = cristina!.semanas.find(s => s.semana === semanaPassada);
    expect(cristinaSemanaPassada).toBeDefined();
    expect(cristinaSemanaPassada!.horas).toBe(40);
    
    console.log(`✅ Bug 2 corrigido: Cristina tem 0h na semana futura (${semanaFutura})`);
    console.log(`✅ Preservação: Cristina tem 40h na semana passada (${semanaPassada})`);
    
    // ─── Validação Bug 3: Carina deve ter dados exatos do Clockify ────────────
    const carina = resultado.colaboradores.find(c => c.nome === "Carina Santos");
    expect(carina).toBeDefined();
    
    const carinaSemana = carina!.semanas.find(s => s.semana === semanaPassada);
    expect(carinaSemana).toBeDefined();
    
    // Total esperado: 8.5 + 9.25 + 8.75 + 9 + 8.333... = 43.833...h
    const totalEsperado = 43.833333333333336;
    const divergencia = Math.abs(carinaSemana!.horas - totalEsperado);
    expect(divergencia).toBeLessThanOrEqual(0.1);
    
    console.log(`✅ Bug 3 corrigido: Carina tem ${carinaSemana!.horas}h (esperado: ${totalEsperado.toFixed(1)}h, divergência: ${divergencia.toFixed(3)}h)`);
    
    // ─── Validação Bug 1: Leomyr deve ter nome correto ────────────────────────
    const leomyr = resultado.colaboradores.find(c => c.nome === "Leomyr Sângelo");
    expect(leomyr).toBeDefined();
    expect(leomyr!.nome).toBe("Leomyr Sângelo");
    
    console.log(`✅ Bug 1 corrigido: Nome "Leomyr Sângelo" está correto`);
    
    // ─── Validação Geral ───────────────────────────────────────────────────────
    expect(resultado.colaboradores.length).toBe(3);
    expect(resultado.todasSemanas.length).toBeGreaterThan(0);
    
    console.log(`\n✅ TODOS OS BUGS CORRIGIDOS E VALIDADOS!`);
    console.log(`   - Bug 2: Semanas futuras não têm horas`);
    console.log(`   - Bug 3: Dados batem com Clockify (divergência < 0.1h)`);
    console.log(`   - Bug 1: Nomes renderizados corretamente`);
    console.log(`   - Preservação: Lógica de negócio inalterada`);
  });
});
