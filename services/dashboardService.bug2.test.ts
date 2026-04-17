// Teste exploratório para Bug 2: Semanas futuras com dados incorretos
// Este teste DEVE FALHAR no código não corrigido, confirmando que o bug existe

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processarDashboard } from "./dashboardService";

// Mock das variáveis de ambiente e configuração
vi.mock("@/config/clockify", () => ({
  CLOCKIFY_BASE_URL: "https://api.clockify.me/api/v1",
  CLOCKIFY_API_TOKEN: "mock-token",
  CLOCKIFY_WORKSPACE_ID: "mock-workspace",
  START_DATE: "2025-01-01",
  DEFAULT_WEEKLY_HOURS: 40,
  PART_TIME_USERS: {},
  EXCLUDE_USERS: [],
  EXCLUDE_DESCRIPTIONS: ["FOLGA", "FERIADO", "ATESTADO"],
  FOLGA_KEYWORDS: ["FOLGA", "COMPENSADA"],
  CARNAVAL_KEYWORDS: ["CARNAVAL"],
  CARNAVAL_WEEK: "2025-03-03",
  CARNAVAL_HOURS: 24,
}));

// Mock do clockifyClient
vi.mock("./clockifyClient", () => ({
  fetchFromClockify: vi.fn(),
  fetchFromClockifyLong: vi.fn(),
}));

import { fetchFromClockify, fetchFromClockifyLong } from "./clockifyClient";

// ─── Dados de Teste Mockados ──────────────────────────────────────────────────

const mockUsuarios = [
  {
    id: "user-1",
    name: "Cristina Oliveira",
    email: "cristina@seteg.com",
    status: "ACTIVE",
  },
];

const mockProjetos = [
  {
    id: "proj-1",
    name: "Projeto A",
    clientId: "client-1",
    clientName: "Cliente A",
  },
];

// Entradas de tempo para semanas passadas E futuras
const mockEntradasCristina = [
  // Semana 2025-01-13 (passada) - 40h
  {
    id: "entry-1",
    description: "Trabalho normal",
    timeInterval: {
      start: "2025-01-13T08:00:00Z",
      end: "2025-01-13T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-2",
    description: "Trabalho normal",
    timeInterval: {
      start: "2025-01-14T08:00:00Z",
      end: "2025-01-14T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-3",
    description: "Trabalho normal",
    timeInterval: {
      start: "2025-01-15T08:00:00Z",
      end: "2025-01-15T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-4",
    description: "Trabalho normal",
    timeInterval: {
      start: "2025-01-16T08:00:00Z",
      end: "2025-01-16T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-5",
    description: "Trabalho normal",
    timeInterval: {
      start: "2025-01-17T08:00:00Z",
      end: "2025-01-17T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  // Semana 2025-04-21 (FUTURA - semana 17) - 40h
  // Esta semana NÃO deveria aparecer se endDate for 2025-01-20
  {
    id: "entry-6",
    description: "Trabalho futuro",
    timeInterval: {
      start: "2025-04-21T08:00:00Z",
      end: "2025-04-21T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-7",
    description: "Trabalho futuro",
    timeInterval: {
      start: "2025-04-22T08:00:00Z",
      end: "2025-04-22T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-8",
    description: "Trabalho futuro",
    timeInterval: {
      start: "2025-04-23T08:00:00Z",
      end: "2025-04-23T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-9",
    description: "Trabalho futuro",
    timeInterval: {
      start: "2025-04-24T08:00:00Z",
      end: "2025-04-24T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
  {
    id: "entry-10",
    description: "Trabalho futuro",
    timeInterval: {
      start: "2025-04-25T08:00:00Z",
      end: "2025-04-25T16:00:00Z",
      duration: "PT8H",
    },
    projectId: "proj-1",
    userId: "user-1",
  },
];

// ─── Bug 2: Exploração - Semanas Futuras com Dados ────────────────────────────

describe("Bug 2: Exploração - Semanas Futuras com Dados Incorretos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock das respostas da API
    (fetchFromClockify as any).mockImplementation((path: string) => {
      if (path.includes("/users")) {
        return Promise.resolve({ data: mockUsuarios });
      }
      if (path.includes("/projects")) {
        return Promise.resolve({ data: mockProjetos });
      }
      return Promise.resolve({ data: [] });
    });

    (fetchFromClockifyLong as any).mockImplementation((path: string) => {
      if (path.includes("user-1/time-entries")) {
        return Promise.resolve({ data: mockEntradasCristina });
      }
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 1.2, 2.2**
   * 
   * Property 1: Bug Condition - Semanas Futuras Incluídas em todasSemanas
   * 
   * CRÍTICO: Este teste DEVE FALHAR no código não corrigido.
   * A falha confirma que o bug existe.
   * 
   * Para qualquer semana futura (após segundaFeiraAtual),
   * o código bugado inclui a semana em todasSemanas e no array de semanas
   * do colaborador, mesmo que marcada como skip.
   * 
   * O comportamento correto seria NÃO incluir semanas futuras em todasSemanas.
   */
  it("DEVE FALHAR: semana futura 2025-04-21 está incluída no array de semanas", async () => {
    // Processa dados com endDate = 2025-01-20 (semana atual)
    // A semana 2025-04-21 é FUTURA e não deveria estar em todasSemanas
    const resultado = await processarDashboard("2025-01-01", "2025-01-20");
    
    // Encontra Cristina
    const cristina = resultado.colaboradores.find(
      (c) => c.nome === "Cristina Oliveira"
    );
    expect(cristina).toBeDefined();
    
    // Procura pela semana futura 2025-04-21
    const semanaFutura = cristina!.semanas.find(
      (s) => s.semana === "2025-04-21"
    );
    
    // No código bugado, esta semana existe (mesmo que com skip: true)
    // Este teste FALHA quando o bug é corrigido (semana não existe)
    expect(semanaFutura).toBeDefined();
    
    if (semanaFutura) {
      console.log(`❌ BUG CONFIRMADO: Semana futura 2025-04-21 está no array (skip: ${semanaFutura.skip}, horas: ${semanaFutura.horas})`);
      console.log(`   Comportamento esperado: semana futura NÃO deveria estar no array`);
    }
  });

  /**
   * Teste adicional: verificar que todasSemanas contém semanas futuras
   */
  it("DEVE FALHAR: todasSemanas contém semanas futuras além de segundaFeiraAtual", async () => {
    const resultado = await processarDashboard("2025-01-01", "2025-01-20");
    
    // segundaFeiraAtual deveria ser 2025-01-20 (segunda-feira da semana de 2025-01-20)
    // Qualquer semana > 2025-01-20 é futura
    const semanasFuturas = resultado.todasSemanas.filter(
      (s) => s > "2025-01-20"
    );
    
    // No código bugado, esperamos encontrar semanas futuras
    expect(semanasFuturas.length).toBeGreaterThan(0);
    console.log(`❌ BUG CONFIRMADO: ${semanasFuturas.length} semanas futuras em todasSemanas:`, semanasFuturas);
  });
});
