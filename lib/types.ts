// Definições de tipos e interfaces TypeScript do ClockView — SETEG

// ─── Estruturas brutas da Clockify API ────────────────────────────────────────

export interface ClockifyTimeEntry {
  id: string;
  description: string;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  tagIds: string[] | null;
  timeInterval: {
    start: string;
    end: string;
    duration: string; // ISO 8601 duration ex: "PT1H30M"
  };
}

export interface ClockifyUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

export interface ClockifyProject {
  id: string;
  name: string;
  clientName?: string;
  clientId?: string;
}

export interface ClockifyTag {
  id: string;
  name: string;
  workspaceId: string;
}

export interface ClockifyTask {
  id: string;
  name: string;
  projectId: string;
}

// ─── Modelos internos do ClockView ────────────────────────────────────────────

/** Categorias de atividade */
export type Categoria = "campo" | "reuniao" | "escritorio" | "gerenciamento";

/** Resumo de um projeto em uma semana ou no total */
export interface ResumoProjeto {
  nome: string;       // nome do cliente/projeto
  horas: number;
  top3: { 
    desc: string; 
    horas: number;
    tags?: string[];  // nomes das tags
    tarefa?: string;  // nome da tarefa
  }[];
}

/** Dados de uma semana para um colaborador */
export interface SemanaColaborador {
  semana: string;     // YYYY-MM-DD (segunda-feira)
  horas: number;      // horas efetivas (trabalho + ausências redistribuídas)
  pct: number;        // percentual da meta
  skip: boolean;      // semana anterior ao início do colaborador
  carnavalAuto: boolean; // carnaval creditado automaticamente
  projetos: ResumoProjeto[];
  cats: Partial<Record<Categoria, number>>;
}

/** Dados completos de um colaborador */
export interface Colaborador {
  nome: string;
  meta: number;           // horas semanais esperadas
  mediaHoras: number;
  mediaPct: number;
  semanasAcima: number;   // semanas >= 95% da meta
  semanasAbaixo: number;  // semanas com dado mas < 95%
  semanasAusente: number; // semanas sem nenhum dado
  primeiraSemana: string;
  semanas: SemanaColaborador[];
  topProjetos: ResumoProjeto[];
  catsTotal: Partial<Record<Categoria, number>>;
}

/** Payload completo retornado pela API de processamento */
export interface DadosDashboard {
  atualizadoEm: string;
  workspace: string;
  todasSemanas: string[];
  colaboradores: Colaborador[];
}

/** Status do fetch em andamento */
export interface StatusFetch {
  status: "idle" | "fetching" | "ok" | "error";
  message: string;
  ultimaAtualizacao: string | null;
}
