// Configurações e constantes da integração com a Clockify API
// Os valores são lidos exclusivamente de variáveis de ambiente — nunca codificados diretamente

/** URL base da Clockify API REST v1 */
export const CLOCKIFY_BASE_URL = "https://api.clockify.me/api/v1";

/** ID do workspace Clockify configurado via variável de ambiente */
export const CLOCKIFY_WORKSPACE_ID = process.env.CLOCKIFY_WORKSPACE_ID;

/** Token de autenticação da Clockify API — NUNCA exposto ao frontend */
export const CLOCKIFY_API_TOKEN = process.env.CLOCKIFY_API_TOKEN;

// ─── Regras de negócio da SETEG ───────────────────────────────────────────────

/** Data de início padrão para busca de dados */
export const START_DATE = "2026-01-01";

/** Meta de horas semanais padrão */
export const DEFAULT_WEEKLY_HOURS = 40;

/** Usuários com jornada reduzida (part-time) e suas metas em horas */
export const PART_TIME_USERS: Record<string, number> = {
  "Lavinia Oliveira": 20,
};

/** Usuários excluídos do dashboard */
export const EXCLUDE_USERS = ["Maira Carvalho"];

/** Lista de colaboradores permitidos (whitelist) - APENAS estes aparecem no dashboard */
export const ALLOWED_USERS = [
  "CARINA RODRIGUES SILVA",
  "CLAUDIENE DE JESUS ALENCAR",
  "FLORENCIA CRISTINA SILVA NASCIMENTO",
  "FERNANDO CARLOS BARBOSA DE SOUSA",
  "GYRLIANE SANTOS DE SALES",
  "LAÍS BIZERRA MENDES",
  "LAIZE DOS SANTOS RODRIGUES",
  "GUSTAVO ALVES DA COSTA TOLEDO",
  "MARGARIDA NIÉGELA DA COSTA SOUZA",
  "MARIENE ALMEIDA TORRES",
  "HUGO FERNANDES FERREIRA",
  "FRANCISCO NERES DE LIMA",
  "JOÃO MARCELO HOLDERBAUM",
  "JULIANA VICENTE ALENCAR",
  "GABRIEL MONTENEGRO DE ALMEIDA",
  "HENRIQUE LIMA DA SILVA",
  "LAVINIA OLIVEIRA BRAGA",
  "ISMAEL ALVES GADELHA",
  "LIZABETH SILVA OLIVEIRA",
  "LUIZ TIAGO SOARES DE SOUZA",
  "MAIRA GLAUCIA DE CARVALHO SOUSA",
  "JOÃO GABRIEL DE OLIVEIRA NOBRE",
  "LEOMYR SÂNGELO ALVES DA SILVA",
  "MATEUS SOUSA GOMES",
  "MATHEUS FELDSTEIN HADDAD",
  "RAISSA CAROLINE DIAS FERREIRA",
  "RICARDO RODRIGUES DA SILVEIRA FILHO",
  "VITOR FERREIRA SOUZA",
  "VIVIAN RODRIGUES LOPES",
  "WILGNER DOS SANTOS SILVA",
];

/** Palavras-chave nas descrições que indicam ausência (excluídas do cálculo de horas) */
export const EXCLUDE_DESCRIPTIONS = [
  "FOLGA", "FERIADO", "ATESTADO", "ASO", "FERIAS", "FÉRIAS",
  "COMPENSADA", "SEM ACESSO AO SERVIDOR",
];

/** Palavras-chave que indicam folga compensada (redistribuída para semanas anteriores) */
export const FOLGA_KEYWORDS = ["FOLGA", "COMPENSADA"];

/** Palavras-chave que indicam carnaval */
export const CARNAVAL_KEYWORDS = ["CARNAVAL", "CARNNAVAL"];

/** Horas creditadas automaticamente na semana de carnaval */
export const CARNAVAL_HOURS = 24;

/** Segunda-feira da semana de carnaval 2026 */
export const CARNAVAL_WEEK = "2026-02-16";
