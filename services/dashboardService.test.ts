// Testes de exploração e correção de bugs no cálculo de horas
// Bug 2: Semanas futuras com horas indevidas
// Bug 3: Divergência com dados do Clockify

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { getSemana } from "@/lib/businessRules";
import { parseDuration } from "@/lib/durationParser";
import { processarDashboard, invalidarCache } from "./dashboardService";
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
];

const mockProjetos: ClockifyProject[] = [
  { id: "proj1", name: "Projeto A", clientName: "Cliente A" },
  { id: "proj2", name: "Projeto B", clientName: "Cliente B" },
];

// ─── Bug 2: Exploração - Semanas Futuras com Horas ────────────────────────────

describe("Bug 2: Exploração - Semanas Futuras com Horas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidarCache();
  });

  /**
   * **Validates: Requirements 1.3, 1.5, 2.3, 2.5**
   * 
   * Property 1: Bug Condition - Semanas Futuras com Horas Indevidas
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * Para qualquer semana cuja segunda-feira > data atual (semana futura),
   * o sistema NÃO DEVE exibir horas > 0.
   * 
   * Caso específico: Cristina com 40h em semana futura (2025-01-27)
   * quando a data atual é 2025-01-22.
   */
  it("semanas futuras devem ter 0 horas ou skip=true - caso Cristina", async () => {
    // Simula data atual: 2025-01-22 (quarta-feira)
    const dataAtual = "2025-01-22";
    const segundaFeiraAtual = getSemana(dataAtual + "T12:00:00Z"); // 2025-01-20
    
    // Semana futura: 2025-01-27 (segunda-feira da próxima semana)
    const semanaFutura = "2025-01-27";
    
    // Verifica que a semana é realmente futura
    expect(semanaFutura > segundaFeiraAtual).toBe(true);
    
    // Mock: Cristina tem entradas na semana futura (40h)
    const entradasCristina: ClockifyTimeEntry[] = [
      {
        id: "entry1",
        description: "Trabalho em campo",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-27T08:00:00Z", // Segunda-feira da semana futura
          end: "2025-01-27T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry2",
        description: "Relatório",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-28T08:00:00Z", // Terça-feira da semana futura
          end: "2025-01-28T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry3",
        description: "Reunião",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-29T08:00:00Z", // Quarta-feira da semana futura
          end: "2025-01-29T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry4",
        description: "Análise",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-30T08:00:00Z", // Quinta-feira da semana futura
          end: "2025-01-30T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry5",
        description: "Documentação",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-31T08:00:00Z", // Sexta-feira da semana futura
          end: "2025-01-31T16:00:00Z",
          duration: "PT8H",
        },
      },
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
      return { data: [] };
    });
    
    // Processa dashboard
    const resultado = await processarDashboard("2025-01-01", dataAtual);
    
    // Encontra Cristina nos resultados
    const cristina = resultado.colaboradores.find(c => c.nome === "Cristina Silva");
    expect(cristina).toBeDefined();
    
    // Encontra a semana futura
    const semanaFuturaData = cristina!.semanas.find(s => s.semana === semanaFutura);
    expect(semanaFuturaData).toBeDefined();
    
    // VERIFICAÇÃO DO BUG: Semana futura NÃO deve ter horas > 0
    // Este teste DEVE FALHAR no código não corrigido
    expect(
      semanaFuturaData!.horas === 0 || semanaFuturaData!.skip === true
    ).toBe(true);
    
    // Mensagem de erro detalhada se falhar
    if (semanaFuturaData!.horas > 0 && !semanaFuturaData!.skip) {
      console.error(`BUG DETECTADO: Cristina tem ${semanaFuturaData!.horas}h na semana futura ${semanaFutura}`);
      console.error(`Segunda-feira atual: ${segundaFeiraAtual}, Semana futura: ${semanaFutura}`);
      console.error(`Projetos na semana futura:`, semanaFuturaData!.projetos);
    }
  });

  /**
   * Property-based test: Para qualquer data futura, semanas não devem ter horas
   */
  it("property: nenhuma semana futura deve ter horas > 0", async () => {
    // Configura mocks básicos
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[0]] }; // Apenas Cristina
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    await fc.assert(
      fc.asyncProperty(
        // Gera datas futuras (próximos 90 dias)
        fc.integer({ min: 7, max: 90 }),
        async (diasNoFuturo) => {
          invalidarCache();
          
          const hoje = new Date("2025-01-22T12:00:00Z");
          const dataFutura = new Date(hoje);
          dataFutura.setDate(hoje.getDate() + diasNoFuturo);
          
          const semanaFutura = getSemana(dataFutura.toISOString());
          const segundaFeiraAtual = getSemana(hoje.toISOString());
          
          // Apenas testa se for realmente uma semana futura
          if (semanaFutura <= segundaFeiraAtual) {
            return true; // Skip este caso
          }
          
          // Mock: Cria entrada na semana futura
          const entradaFutura: ClockifyTimeEntry[] = [
            {
              id: "entry-future",
              description: "Trabalho futuro",
              userId: "user1",
              projectId: "proj1",
              timeInterval: {
                start: dataFutura.toISOString(),
                end: dataFutura.toISOString(),
                duration: "PT8H",
              },
            },
          ];
          
          vi.mocked(fetchFromClockifyLong).mockResolvedValue({ data: entradaFutura });
          
          const resultado = await processarDashboard("2025-01-01", "2025-01-22");
          const cristina = resultado.colaboradores.find(c => c.nome === "Cristina Silva");
          
          if (!cristina) return true;
          
          const semanaData = cristina.semanas.find(s => s.semana === semanaFutura);
          if (!semanaData) return true;
          
          // VERIFICAÇÃO: Semana futura deve ter 0 horas ou skip=true
          return semanaData.horas === 0 || semanaData.skip === true;
        }
      ),
      { numRuns: 10 } // Reduzido para performance
    );
  });
});

// ─── Bug 2: Preservação - Semanas Passadas Inalteradas ────────────────────────

describe("Bug 2: Preservação - Semanas Passadas Inalteradas", () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property 2: Preservation - Comportamento de Semanas Passadas Inalterado
   * 
   * Para qualquer semana passada (segunda-feira ≤ data atual),
   * o código corrigido DEVE produzir exatamente o mesmo resultado que o código original.
   */
  it("semanas passadas devem ser processadas normalmente", () => {
    const hoje = new Date();
    const semanasPassadas = [];
    
    // Gera últimas 12 semanas
    for (let i = 1; i <= 12; i++) {
      const dataPast = new Date(hoje);
      dataPast.setDate(hoje.getDate() - (i * 7));
      semanasPassadas.push(getSemana(dataPast.toISOString()));
    }
    
    const segundaFeiraAtual = getSemana(hoje.toISOString());
    
    // Todas devem ser <= semana atual
    semanasPassadas.forEach(semana => {
      expect(semana <= segundaFeiraAtual).toBe(true);
    });
    
    // TODO: Verificar que essas semanas são processadas corretamente
  });

  /**
   * Property-based test: Redistribuição de folgas deve funcionar em semanas passadas
   */
  it("property: redistribuição de folgas preservada para semanas passadas", () => {
    fc.assert(
      fc.property(
        // Gera cenários de folgas em semanas passadas
        fc.integer({ min: 1, max: 52 }),
        fc.float({ min: 1, max: 40 }),
        (semanasAtras, horasFolga) => {
          const hoje = new Date();
          const dataPast = new Date(hoje);
          dataPast.setDate(hoje.getDate() - (semanasAtras * 7));
          
          const semanaPast = getSemana(dataPast.toISOString());
          const segundaFeiraAtual = getSemana(hoje.toISOString());
          
          // Verifica que é uma semana passada
          expect(semanaPast <= segundaFeiraAtual).toBe(true);
          
          // TODO: Verificar que redistribuição funciona corretamente
        }
      ),
      { numRuns: 50 }
    );
  });
});


// ─── Bug 2: Preservação - Semanas Passadas Inalteradas ────────────────────────

describe("Bug 2: Preservação - Semanas Passadas Inalteradas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidarCache();
  });

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property 2: Preservation - Comportamento de Semanas Passadas Inalterado
   * 
   * Para qualquer semana passada (segunda-feira ≤ data atual),
   * o código corrigido DEVE produzir exatamente o mesmo resultado que o código original.
   */
  it("semanas passadas devem ser processadas normalmente", async () => {
    const dataAtual = "2025-01-22";
    const segundaFeiraAtual = getSemana(dataAtual + "T12:00:00Z");
    
    // Mock: Cristina tem entradas em semanas passadas
    const entradasPassadas: ClockifyTimeEntry[] = [
      {
        id: "entry1",
        description: "Trabalho em campo",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-13T08:00:00Z", // Semana passada
          end: "2025-01-13T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry2",
        description: "Relatório",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-14T08:00:00Z",
          end: "2025-01-14T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry3",
        description: "Reunião",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-15T08:00:00Z",
          end: "2025-01-15T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry4",
        description: "Análise",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-16T08:00:00Z",
          end: "2025-01-16T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry5",
        description: "Documentação",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-17T08:00:00Z",
          end: "2025-01-17T16:00:00Z",
          duration: "PT8H",
        },
      },
    ];
    
    // Configura mocks
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[0]] };
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    vi.mocked(fetchFromClockifyLong).mockResolvedValue({ data: entradasPassadas });
    
    // Processa dashboard
    const resultado = await processarDashboard("2025-01-01", dataAtual);
    
    // Encontra Cristina
    const cristina = resultado.colaboradores.find(c => c.nome === "Cristina Silva");
    expect(cristina).toBeDefined();
    
    // Verifica semana passada (2025-01-13 é segunda-feira)
    const semanaPassada = "2025-01-13";
    expect(semanaPassada <= segundaFeiraAtual).toBe(true);
    
    const semanaData = cristina!.semanas.find(s => s.semana === semanaPassada);
    expect(semanaData).toBeDefined();
    
    // Semana passada DEVE ter horas calculadas corretamente
    expect(semanaData!.horas).toBeGreaterThan(0);
    expect(semanaData!.skip).toBe(false);
    
    // Deve ter 40h (5 dias × 8h)
    expect(semanaData!.horas).toBe(40);
  });

  /**
   * Property-based test: Redistribuição de folgas deve funcionar em semanas passadas
   */
  it("property: redistribuição de folgas preservada para semanas passadas", async () => {
    // Configura mocks básicos
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[0]] };
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    await fc.assert(
      fc.asyncProperty(
        // Gera cenários de folgas em semanas passadas
        fc.integer({ min: 1, max: 12 }), // Semanas atrás
        fc.float({ min: 8, max: 40 }), // Horas de folga
        async (semanasAtras, horasFolga) => {
          invalidarCache();
          
          const hoje = new Date("2025-01-22T12:00:00Z");
          const dataPast = new Date(hoje);
          dataPast.setDate(hoje.getDate() - (semanasAtras * 7));
          
          const semanaPast = getSemana(dataPast.toISOString());
          const segundaFeiraAtual = getSemana(hoje.toISOString());
          
          // Verifica que é uma semana passada
          expect(semanaPast <= segundaFeiraAtual).toBe(true);
          
          // Mock: Cria entrada de folga na semana passada
          const entradaFolga: ClockifyTimeEntry[] = [
            {
              id: "entry-folga",
              description: "FOLGA COMPENSADA",
              userId: "user1",
              projectId: "proj1",
              timeInterval: {
                start: dataPast.toISOString(),
                end: dataPast.toISOString(),
                duration: `PT${Math.floor(horasFolga)}H`,
              },
            },
          ];
          
          vi.mocked(fetchFromClockifyLong).mockResolvedValue({ data: entradaFolga });
          
          const resultado = await processarDashboard("2025-01-01", "2025-01-22");
          const cristina = resultado.colaboradores.find(c => c.nome === "Cristina Silva");
          
          if (!cristina) return true;
          
          const semanaData = cristina.semanas.find(s => s.semana === semanaPast);
          if (!semanaData) return true;
          
          // VERIFICAÇÃO: Semana passada deve ser processada (não skip)
          return semanaData.skip === false;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Carnaval automático deve ser aplicado apenas na semana de carnaval (se passada)
   */
  it("carnaval automático preservado para semana de carnaval passada", async () => {
    const dataAtual = "2026-03-01"; // Após o carnaval 2026
    const semanaCarnaval = "2026-02-16"; // Segunda-feira da semana de carnaval
    
    // Mock: Cristina não tem entradas na semana de carnaval
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[0]] };
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    // Entradas em outras semanas E na semana de carnaval (com poucas horas)
    const entradas: ClockifyTimeEntry[] = [
      {
        id: "entry1",
        description: "Trabalho",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2026-02-09T08:00:00Z", // Semana antes do carnaval
          end: "2026-02-09T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry2",
        description: "Trabalho",
        userId: "user1",
        projectId: "proj1",
        timeInterval: {
          start: "2026-02-16T08:00:00Z", // Segunda-feira da semana de carnaval (poucas horas)
          end: "2026-02-16T12:00:00Z",
          duration: "PT4H",
        },
      },
    ];
    
    vi.mocked(fetchFromClockifyLong).mockResolvedValue({ data: entradas });
    
    const resultado = await processarDashboard("2026-01-01", dataAtual);
    const cristina = resultado.colaboradores.find(c => c.nome === "Cristina Silva");
    expect(cristina).toBeDefined();
    
    const semanaData = cristina!.semanas.find(s => s.semana === semanaCarnaval);
    expect(semanaData).toBeDefined();
    
    // VERIFICAÇÃO: Carnaval automático deve ter sido aplicado (24h)
    // Se a pessoa não marcou carnaval e trabalhou < 24h, recebe 24h automático
    expect(semanaData!.carnavalAuto).toBe(true);
    expect(semanaData!.horas).toBeGreaterThanOrEqual(24);
  });
});


// ─── Bug 3: Exploração - Divergência com Clockify ─────────────────────────────

describe("Bug 3: Exploração - Divergência com Clockify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidarCache();
  });

  /**
   * **Validates: Requirements 1.6, 1.7, 1.8, 2.6, 2.7, 2.8**
   * 
   * Property 1: Bug Condition - Divergência entre Dashboard e Clockify
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * Para qualquer colaborador com entradas no Clockify em semanas passadas,
   * os valores de horas do dashboard DEVEM corresponder aos dados do Clockify.
   * Tolerância máxima: 0.1h (6 minutos).
   */
  it("dados do dashboard devem corresponder exatamente ao Clockify - caso Carina", async () => {
    const dataAtual = "2025-01-22";
    
    // Mock: Carina tem entradas específicas no Clockify
    const entradasCarina: ClockifyTimeEntry[] = [
      {
        id: "entry1",
        description: "Trabalho em campo",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-13T08:00:00Z",
          end: "2025-01-13T16:30:00Z",
          duration: "PT8H30M", // 8.5h
        },
      },
      {
        id: "entry2",
        description: "Relatório",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-14T08:00:00Z",
          end: "2025-01-14T17:15:00Z",
          duration: "PT9H15M", // 9.25h
        },
      },
      {
        id: "entry3",
        description: "Reunião",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-15T08:00:00Z",
          end: "2025-01-15T16:45:00Z",
          duration: "PT8H45M", // 8.75h
        },
      },
      {
        id: "entry4",
        description: "Análise",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-16T08:00:00Z",
          end: "2025-01-16T17:00:00Z",
          duration: "PT9H", // 9h
        },
      },
      {
        id: "entry5",
        description: "Documentação",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-17T08:00:00Z",
          end: "2025-01-17T16:20:00Z",
          duration: "PT8H20M", // 8.333...h
        },
      },
    ];
    
    // Calcula total esperado do Clockify
    const totalClockify = entradasCarina.reduce((acc, e) => {
      return acc + parseDuration(e.timeInterval.duration);
    }, 0);
    
    console.log(`Total esperado do Clockify: ${totalClockify}h`);
    
    // Configura mocks
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[1]] }; // Apenas Carina
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    vi.mocked(fetchFromClockifyLong).mockImplementation(async (path: string) => {
      if (path.includes("user2")) {
        return { data: entradasCarina };
      }
      return { data: [] };
    });
    
    // Processa dashboard
    const resultado = await processarDashboard("2025-01-01", dataAtual);
    
    // Encontra Carina
    const carina = resultado.colaboradores.find(c => c.nome === "Carina Santos");
    expect(carina).toBeDefined();
    
    // Encontra a semana
    const semana = "2025-01-13";
    const semanaData = carina!.semanas.find(s => s.semana === semana);
    expect(semanaData).toBeDefined();
    
    const horasDashboard = semanaData!.horas;
    console.log(`Horas no dashboard: ${horasDashboard}h`);
    console.log(`Diferença: ${Math.abs(horasDashboard - totalClockify)}h`);
    
    // VERIFICAÇÃO DO BUG: Divergência deve ser <= 0.1h
    // Este teste DEVE FALHAR no código não corrigido se houver divergência
    const divergencia = Math.abs(horasDashboard - totalClockify);
    expect(divergencia).toBeLessThanOrEqual(0.1);
    
    // Mensagem de erro detalhada se falhar
    if (divergencia > 0.1) {
      console.error(`BUG DETECTADO: Divergência de ${divergencia}h entre dashboard e Clockify`);
      console.error(`Clockify: ${totalClockify}h, Dashboard: ${horasDashboard}h`);
    }
  });

  /**
   * Property-based test: Para qualquer conjunto de entradas, dados devem bater
   */
  it("property: dados do dashboard devem corresponder ao Clockify", async () => {
    // Configura mocks básicos
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[1]] };
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    await fc.assert(
      fc.asyncProperty(
        // Gera conjunto de entradas aleatórias
        fc.array(
          fc.record({
            horas: fc.integer({ min: 1, max: 12 }),
            minutos: fc.integer({ min: 0, max: 59 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (entradas) => {
          invalidarCache();
          
          const dataBase = new Date("2025-01-13T08:00:00Z");
          
          // Cria entradas mockadas
          const entradasMock: ClockifyTimeEntry[] = entradas.map((e, idx) => ({
            id: `entry-${idx}`,
            description: "Trabalho",
            userId: "user2",
            projectId: "proj1",
            timeInterval: {
              start: new Date(dataBase.getTime() + idx * 3600000).toISOString(),
              end: new Date(dataBase.getTime() + idx * 3600000).toISOString(),
              duration: `PT${e.horas}H${e.minutos}M`,
            },
          }));
          
          // Calcula total esperado
          const totalEsperado = entradasMock.reduce((acc, e) => {
            return acc + parseDuration(e.timeInterval.duration);
          }, 0);
          
          vi.mocked(fetchFromClockifyLong).mockResolvedValue({ data: entradasMock });
          
          const resultado = await processarDashboard("2025-01-01", "2025-01-22");
          const carina = resultado.colaboradores.find(c => c.nome === "Carina Santos");
          
          if (!carina) return true;
          
          const semana = "2025-01-13";
          const semanaData = carina.semanas.find(s => s.semana === semana);
          
          if (!semanaData) return true;
          
          // VERIFICAÇÃO: Divergência deve ser <= 0.1h
          const divergencia = Math.abs(semanaData.horas - totalEsperado);
          return divergencia <= 0.1;
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Bug 3: Preservação - Lógica de Negócio Preservada ────────────────────────

describe("Bug 3: Preservação - Lógica de Negócio Preservada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidarCache();
  });

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
   * 
   * Property 2: Preservation - Lógica de Negócio Preservada
   * 
   * Para qualquer entrada válida do Clockify,
   * o código corrigido DEVE manter a mesma lógica de negócio.
   */
  it("redistribuição de folgas deve funcionar corretamente", async () => {
    const dataAtual = "2025-01-22";
    
    // Mock: Carina tem trabalho em excesso na semana 1 e folga na semana 2
    const entradas: ClockifyTimeEntry[] = [
      // Semana 1: 48h (excesso de 8h)
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `entry-s1-${i}`,
        description: "Trabalho",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: `2025-01-13T0${8 + i}:00:00Z`,
          end: `2025-01-13T0${8 + i}:00:00Z`,
          duration: "PT8H",
        },
      })),
      // Semana 2: 8h de folga
      {
        id: "entry-folga",
        description: "FOLGA COMPENSADA",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-20T08:00:00Z",
          end: "2025-01-20T16:00:00Z",
          duration: "PT8H",
        },
      },
    ];
    
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[1]] };
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    vi.mocked(fetchFromClockifyLong).mockResolvedValue({ data: entradas });
    
    const resultado = await processarDashboard("2025-01-01", dataAtual);
    const carina = resultado.colaboradores.find(c => c.nome === "Carina Santos");
    expect(carina).toBeDefined();
    
    const semana1 = carina!.semanas.find(s => s.semana === "2025-01-13");
    const semana2 = carina!.semanas.find(s => s.semana === "2025-01-20");
    
    expect(semana1).toBeDefined();
    expect(semana2).toBeDefined();
    
    // VERIFICAÇÃO: Redistribuição deve ter deduzido 8h da semana 1
    // Semana 1: 48h - 8h (deduzido) = 40h
    expect(semana1!.horas).toBe(40);
    
    // Semana 2: 8h de folga (adicionada ao effective)
    expect(semana2!.horas).toBe(8);
  });

  /**
   * Categorização de atividades deve funcionar corretamente
   */
  it("categorização de atividades preservada", async () => {
    const dataAtual = "2025-01-22";
    
    // Mock: Entradas com diferentes categorias
    const entradas: ClockifyTimeEntry[] = [
      {
        id: "entry1",
        description: "Trabalho | CAMPO",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-13T08:00:00Z",
          end: "2025-01-13T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry2",
        description: "REUNIAO com cliente",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-14T08:00:00Z",
          end: "2025-01-14T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry3",
        description: "RELATORIO técnico",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-15T08:00:00Z",
          end: "2025-01-15T16:00:00Z",
          duration: "PT8H",
        },
      },
      {
        id: "entry4",
        description: "Gestão de projeto",
        userId: "user2",
        projectId: "proj1",
        timeInterval: {
          start: "2025-01-16T08:00:00Z",
          end: "2025-01-16T16:00:00Z",
          duration: "PT8H",
        },
      },
    ];
    
    vi.mocked(fetchFromClockify).mockImplementation(async (path: string) => {
      if (path.includes("/users")) {
        return { data: [mockUsuarios[1]] };
      }
      if (path.includes("/projects")) {
        return { data: mockProjetos };
      }
      return { status: 404, message: "Not found" };
    });
    
    vi.mocked(fetchFromClockifyLong).mockResolvedValue({ data: entradas });
    
    const resultado = await processarDashboard("2025-01-01", dataAtual);
    const carina = resultado.colaboradores.find(c => c.nome === "Carina Santos");
    expect(carina).toBeDefined();
    
    const semana = carina!.semanas.find(s => s.semana === "2025-01-13");
    expect(semana).toBeDefined();
    
    // VERIFICAÇÃO: Categorias devem estar presentes
    expect(semana!.cats.campo).toBe(8);
    expect(semana!.cats.reuniao).toBe(8);
    expect(semana!.cats.escritorio).toBe(8);
    expect(semana!.cats.gerenciamento).toBe(8);
  });
});
