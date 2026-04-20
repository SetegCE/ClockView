// Serviço principal de processamento do dashboard SETEG
// Busca paralela com concorrência controlada + cache em memória

import { parseDuration } from "@/lib/durationParser";
import { isFolga, isCarnaval, isExcluida, categorizar, getSemana } from "@/lib/businessRules";
import {
  CLOCKIFY_API_TOKEN,
  CLOCKIFY_WORKSPACE_ID,
  START_DATE,
  DEFAULT_WEEKLY_HOURS,
  PART_TIME_USERS,
  EXCLUDE_USERS,
  CARNAVAL_WEEK,
  CARNAVAL_HOURS,
} from "@/config/clockify";
import { fetchFromClockify, fetchFromClockifyLong } from "./clockifyClient";
import type {
  ClockifyTimeEntry,
  ClockifyUser,
  ClockifyProject,
  ClockifyTag,
  Colaborador,
  DadosDashboard,
  ResumoProjeto,
  SemanaColaborador,
  Categoria,
} from "@/lib/types";

// ─── Cache em memória (persiste entre requisições no mesmo processo) ──────────
interface CacheEntry {
  dados: DadosDashboard;
  timestamp: number;
  chave: string; // inclui período para evitar conflito
}

const globalCache = global as typeof global & { _clockviewCache?: CacheEntry };
const CACHE_TTL_MS = 1 * 60 * 1000; // 1 minuto para debug

export function getCacheDados(chave: string): DadosDashboard | null {
  const entry = globalCache._clockviewCache;
  if (!entry) return null;
  if (entry.chave !== chave) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.dados;
}

function setCacheDados(dados: DadosDashboard, chave: string) {
  globalCache._clockviewCache = { dados, timestamp: Date.now(), chave };
}

export function invalidarCache() {
  globalCache._clockviewCache = undefined;
}

// ─── Estruturas internas de acumulação ────────────────────────────────────────

/**
 * Executa promises em paralelo com limite de concorrência.
 * Evita sobrecarregar a API do Clockify com muitas requisições simultâneas.
 */
async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

interface BucketSemana {
  work: number;
  folga: number;
  carnaval: number;
  absence: number;
  projetos: Map<string, Map<string, number>>; // cliente → desc → horas (volta ao original)
  cats: Map<Categoria, number>;
  // Novos mapas para tags e tarefas
  tagsMap: Map<string, Map<string, string[]>>; // cliente → desc → tags
  tarefasMap: Map<string, Map<string, string | null>>; // cliente → desc → tarefa
}

function novoBucket(): BucketSemana {
  return { 
    work: 0, 
    folga: 0, 
    carnaval: 0, 
    absence: 0, 
    projetos: new Map(), 
    cats: new Map(),
    tagsMap: new Map(),
    tarefasMap: new Map()
  };
}

// ─── Helpers de nome ─────────────────────────────────────────────────────────

/**
 * Remove o sufixo " | SETEG" (e variações) do nome do colaborador.
 * Ex: "Leomyr Sângelo | SETEG" → "Leomyr Sângelo"
 */
function limparNome(nome: string): string {
  return nome.replace(/\s*\|\s*SETEG\s*$/i, "").trim();
}

// ─── Busca de dados brutos ────────────────────────────────────────────────────

async function buscarUsuarios(): Promise<ClockifyUser[]> {
  // Busca TODOS os usuários ACTIVE com paginação
  const todosUsuarios: ClockifyUser[] = [];
  let page = 1;
  
  while (true) {
    const r = await fetchFromClockify<ClockifyUser[]>(
      `/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=ACTIVE&page=${page}&page-size=200`,
      CLOCKIFY_API_TOKEN,
    );
    if ("status" in r) throw new Error(r.message);
    if (r.data.length === 0) break;
    todosUsuarios.push(...r.data);
    if (r.data.length < 200) break;
    page++;
  }
  
  return todosUsuarios;
}

async function buscarProjetos(): Promise<ClockifyProject[]> {
  const todosProjetos: ClockifyProject[] = [];
  
  // Busca projetos ativos com paginação
  let pageAtivos = 1;
  while (true) {
    const r = await fetchFromClockify<ClockifyProject[]>(
      `/workspaces/${CLOCKIFY_WORKSPACE_ID}/projects?archived=false&page=${pageAtivos}&page-size=500`,
      CLOCKIFY_API_TOKEN,
    );
    if ("status" in r || r.data.length === 0) break;
    todosProjetos.push(...r.data);
    if (r.data.length < 500) break;
    pageAtivos++;
  }
  
  // Busca projetos arquivados com paginação
  let pageArquivados = 1;
  while (true) {
    const r = await fetchFromClockify<ClockifyProject[]>(
      `/workspaces/${CLOCKIFY_WORKSPACE_ID}/projects?archived=true&page=${pageArquivados}&page-size=500`,
      CLOCKIFY_API_TOKEN,
    );
    if ("status" in r || r.data.length === 0) break;
    todosProjetos.push(...r.data);
    if (r.data.length < 500) break;
    pageArquivados++;
  }
  
  return todosProjetos;
}

async function buscarTags(): Promise<ClockifyTag[]> {
  // Busca TODAS as tags com paginação
  const todasTags: ClockifyTag[] = [];
  let page = 1;
  
  while (true) {
    const r = await fetchFromClockify<ClockifyTag[]>(
      `/workspaces/${CLOCKIFY_WORKSPACE_ID}/tags?page=${page}&page-size=200`,
      CLOCKIFY_API_TOKEN,
    );
    if ("status" in r) return todasTags;
    if (r.data.length === 0) break;
    todasTags.push(...r.data);
    if (r.data.length < 200) break;
    page++;
  }
  
  return todasTags;
}

async function buscarTarefasProjeto(projectId: string): Promise<Map<string, string>> {
  // Busca TODAS as tarefas do projeto com paginação
  const todasTarefas: any[] = [];
  let page = 1;
  
  while (true) {
    const r = await fetchFromClockify<any[]>(
      `/workspaces/${CLOCKIFY_WORKSPACE_ID}/projects/${projectId}/tasks?page=${page}&page-size=200`,
      CLOCKIFY_API_TOKEN,
    );
    if ("status" in r) break;
    if (r.data.length === 0) break;
    todasTarefas.push(...r.data);
    if (r.data.length < 200) break;
    page++;
  }
  
  return new Map(todasTarefas.map((t: any) => [t.id, t.name]));
}


async function buscarEntradasUsuario(
  userId: string,
  start: string,
  end: string,
): Promise<ClockifyTimeEntry[]> {
  const todas: ClockifyTimeEntry[] = [];
  let page = 1;

  while (true) {
    const path = `/workspaces/${CLOCKIFY_WORKSPACE_ID}/user/${userId}/time-entries?start=${start}&end=${end}&page=${page}&page-size=500`;
    const r = await fetchFromClockifyLong<ClockifyTimeEntry[]>(path, CLOCKIFY_API_TOKEN);
    if ("status" in r) break;
    todas.push(...r.data);
    if (r.data.length < 500) break;
    page++;
  }

  return todas;
}

// ─── Processamento principal ──────────────────────────────────────────────────

export async function processarDashboard(startDate?: string, endDate?: string): Promise<DadosDashboard> {
  const hoje = new Date().toISOString().slice(0, 10);
  const startISO = `${startDate ?? START_DATE}T00:00:00Z`;
  const endISO = `${endDate ?? hoje}T23:59:59Z`;
  const chaveCache = `v3-${startISO}|${endISO}`; // v3 para forçar nova busca com tags/tarefas corrigidas

  // Retorna do cache se ainda válido para o mesmo período
  const cached = getCacheDados(chaveCache);
  if (cached) return cached;

  // Calcula segunda-feira da semana atual para filtrar semanas futuras
  const segundaFeiraAtual = getSemana(endDate ? `${endDate}T23:59:59Z` : `${hoje}T23:59:59Z`);

  // Busca usuários, projetos e tags em paralelo
  const [usuarios, projetos, tags] = await Promise.all([
    buscarUsuarios(), 
    buscarProjetos(),
    buscarTags()
  ]);

  console.log('[DEBUG] Total de tags encontradas:', tags.length);
  if (tags.length > 0) {
    console.log('[DEBUG] Primeiras 5 tags:', tags.slice(0, 5).map(t => t.name));
  }

  // Mapas de lookup
  const mapaUsuarios = new Map(
    usuarios
      .filter((u) => !EXCLUDE_USERS.some(ex => limparNome(u.name) === ex || u.name.includes(ex)))
      .map((u) => [u.id, limparNome(u.name)]),
  );

  const mapaProjetos = new Map(
    projetos.map((p) => {
      // Se tem clientName, formata como "Código - Cliente"
      // Senão, usa apenas o nome do projeto
      const nomeFormatado = p.clientName 
        ? `${p.name} - ${p.clientName}`
        : p.name;
      return [p.id, nomeFormatado];
    }),
  );

  const mapaTags = new Map(
    tags.map((t) => [t.id, t.name]),
  );

  // Cache de tarefas por projeto (busca sob demanda)
  const cacheTarefas = new Map<string, Map<string, string>>();
  
  async function obterNomeTarefa(projectId: string, taskId: string): Promise<string | null> {
    if (!cacheTarefas.has(projectId)) {
      cacheTarefas.set(projectId, await buscarTarefasProjeto(projectId));
    }
    return cacheTarefas.get(projectId)?.get(taskId) ?? null;
  }

  // Acumulador: nome → semana → bucket
  const raw = new Map<string, Map<string, BucketSemana>>();

  // Busca entradas de todos os usuários em paralelo (máx 5 simultâneos)
  const usuariosArray = Array.from(mapaUsuarios.entries());
  const tasks = usuariosArray.map(([uid, uname]) => async () => {
    const entradas = await buscarEntradasUsuario(uid, startISO, endISO);
    const semanas = new Map<string, BucketSemana>();

    for (const e of entradas) {
      const interval = e.timeInterval;
      if (!interval?.start) continue;

      const semana = getSemana(interval.start);
      const horas = parseDuration(interval.duration ?? "");
      const desc = (e.description ?? "").trim();
      const cliente = e.projectId ? (mapaProjetos.get(e.projectId) ?? "Sem Código Registrado") : "Sem Código Registrado";

      // Processa tags
      const tagNames: string[] = [];
      if (e.tagIds && e.tagIds.length > 0) {
        for (const tagId of e.tagIds) {
          const tagName = mapaTags.get(tagId);
          if (tagName) tagNames.push(tagName);
        }
        if (tagNames.length > 0) {
          console.log('[DEBUG] Entrada com tags:', { desc, tagNames });
        }
      }

      // Processa tarefa (busca sob demanda)
      let tarefaNome: string | null = null;
      if (e.taskId && e.projectId) {
        tarefaNome = await obterNomeTarefa(e.projectId, e.taskId);
      }

      if (!semanas.has(semana)) semanas.set(semana, novoBucket());
      const bucket = semanas.get(semana)!;

      if (isCarnaval(desc)) {
        bucket.carnaval += horas;
      } else if (isFolga(desc)) {
        bucket.folga += horas;
      } else if (isExcluida(desc)) {
        bucket.absence += horas;
      } else {
        bucket.work += horas;
        if (!bucket.projetos.has(cliente)) {
          bucket.projetos.set(cliente, new Map());
          bucket.tagsMap.set(cliente, new Map());
          bucket.tarefasMap.set(cliente, new Map());
        }
        
        const descMap = bucket.projetos.get(cliente)!;
        const tagsDescMap = bucket.tagsMap.get(cliente)!;
        const tarefasDescMap = bucket.tarefasMap.get(cliente)!;
        
        // Armazena horas
        descMap.set(desc, (descMap.get(desc) ?? 0) + horas);
        
        // Armazena tags (acumula tags únicas)
        if (tagNames.length > 0) {
          const tagsExistentes = tagsDescMap.get(desc) ?? [];
          const tagsUnicas = Array.from(new Set([...tagsExistentes, ...tagNames]));
          tagsDescMap.set(desc, tagsUnicas);
        }
        
        // Armazena tarefa (primeira encontrada)
        if (tarefaNome && !tarefasDescMap.has(desc)) {
          tarefasDescMap.set(desc, tarefaNome);
        }
        
        const cat = categorizar(desc);
        bucket.cats.set(cat, (bucket.cats.get(cat) ?? 0) + horas);
      }
    }

    return { uname, semanas };
  });

  // Concorrência de 5: busca 5 usuários ao mesmo tempo
  const resultados = await parallelLimit(tasks, 5);
  for (const { uname, semanas } of resultados) {
    raw.set(uname, semanas);
  }

  // Coleta todas as semanas disponíveis (apenas até segundaFeiraAtual)
  const todasSemanasSet = new Set<string>();
  for (const semanas of Array.from(raw.values())) {
    for (const s of Array.from(semanas.keys())) {
      // Filtra semanas futuras: apenas inclui semanas <= segundaFeiraAtual
      if (s <= segundaFeiraAtual) {
        todasSemanasSet.add(s);
      }
    }
  }
  const todasSemanas = Array.from(todasSemanasSet).sort();

  // Processa cada colaborador
  const colaboradores: Colaborador[] = [];

  for (const [nome, semanas] of Array.from(raw.entries())) {
    const meta = PART_TIME_USERS[nome] ?? DEFAULT_WEEKLY_HOURS;

    // Primeira semana com algum dado
    const primeiraSemana = todasSemanas.find((s) => {
      const b = semanas.get(s);
      if (!b) return false;
      return b.work + b.folga + b.carnaval + b.absence > 0;
    });
    if (!primeiraSemana) continue;

    // Monta array de semanas ordenadas
    const semanasOrdenadas: Array<{
      semana: string;
      work: number;
      folga: number;
      carnaval: number;
      absence: number;
      effective: number;
      skip: boolean;
      carnavalAuto: boolean;
      projetos: ResumoProjeto[];
      cats: Partial<Record<Categoria, number>>;
    }> = [];

    for (const s of todasSemanas) {
      // Marca como skip se for antes da primeira semana OU se for semana futura
      if (s < primeiraSemana || s > segundaFeiraAtual) {
        semanasOrdenadas.push({
          semana: s, work: 0, folga: 0, carnaval: 0, absence: 0,
          effective: 0, skip: true, carnavalAuto: false, projetos: [], cats: {},
        });
        continue;
      }

      const b = semanas.get(s) ?? novoBucket();
      const effective = b.work + b.absence + b.carnaval;

      // Converte projetos para ResumoProjeto[]
      const projetosList: ResumoProjeto[] = [];
      for (const [cliente, descMap] of Array.from(b.projetos.entries())) {
        const tagsDescMap = b.tagsMap.get(cliente) ?? new Map();
        const tarefasDescMap = b.tarefasMap.get(cliente) ?? new Map();
        
        const entries = Array.from(descMap.entries()) as [string, number][];
        const totalH = entries.reduce((a, [_, horas]) => a + horas, 0);
        // Mostra TODAS as atividades (sem limite de top 3)
        const todasAtividades = entries
          .sort((a, b) => b[1] - a[1])
          .map(([desc, horas]) => {
            const tags = tagsDescMap.get(desc);
            const tarefa = tarefasDescMap.get(desc);
            
            return { 
              desc, 
              horas: Math.round(horas * 10) / 10,
              tags: tags && tags.length > 0 ? tags : undefined,
              tarefa: tarefa ?? undefined
            };
          });
        projetosList.push({ nome: cliente, horas: Math.round(totalH * 10) / 10, top3: todasAtividades });
      }
      projetosList.sort((a, b) => b.horas - a.horas);

      // Converte cats
      const cats: Partial<Record<Categoria, number>> = {};
      for (const [cat, h] of Array.from(b.cats.entries())) {
        (cats as Record<string, number>)[cat] = Math.round(h * 10) / 10;
      }

      semanasOrdenadas.push({
        semana: s, work: b.work, folga: b.folga, carnaval: b.carnaval,
        absence: b.absence, effective, skip: false, carnavalAuto: false,
        projetos: projetosList, cats,
      });
    }

    // Carnaval automático: credita 24h para quem não marcou na semana de carnaval
    for (const s of semanasOrdenadas) {
      if (s.semana !== CARNAVAL_WEEK || s.skip) continue;
      const temCarnaval = s.carnaval > 0 || s.absence >= 16;
      if (!temCarnaval && s.work < 24) {
        s.effective += CARNAVAL_HOURS;
        s.carnavalAuto = true;
      }
    }

    // Redistribuição de folgas para semanas anteriores
    for (let i = 0; i < semanasOrdenadas.length; i++) {
      const s = semanasOrdenadas[i];
      if (s.skip || s.folga <= 0) continue;
      s.effective += s.folga;
      let restante = s.folga;
      for (let j = i - 1; j >= 0 && restante > 0; j--) {
        const prev = semanasOrdenadas[j];
        if (prev.skip) continue;
        const excesso = Math.max(0, prev.effective - meta);
        if (excesso > 0) {
          const deduzir = Math.min(excesso, restante);
          prev.effective -= deduzir;
          restante -= deduzir;
        }
      }
    }

    // Projetos totais do período (COM tags/tarefas no agregado)
    const projTotalMap = new Map<string, { 
      horas: number; 
      descs: Map<string, { horas: number; tags: Set<string>; tarefa: string | null }> 
    }>();
    const catsTotalMap = new Map<Categoria, number>();

    for (const s of semanasOrdenadas) {
      for (const pr of s.projetos) {
        if (!projTotalMap.has(pr.nome)) {
          projTotalMap.set(pr.nome, { horas: 0, descs: new Map() });
        }
        const pt = projTotalMap.get(pr.nome)!;
        pt.horas += pr.horas;
        for (const t of pr.top3) {
          if (!pt.descs.has(t.desc)) {
            pt.descs.set(t.desc, { horas: 0, tags: new Set(), tarefa: null });
          }
          const descData = pt.descs.get(t.desc)!;
          descData.horas += t.horas;
          
          // Agrega tags (união de todas as tags)
          if (t.tags) {
            for (const tag of t.tags) {
              descData.tags.add(tag);
            }
          }
          
          // Armazena primeira tarefa encontrada
          if (t.tarefa && !descData.tarefa) {
            descData.tarefa = t.tarefa;
          }
        }
      }
      for (const [cat, h] of Object.entries(s.cats) as [Categoria, number][]) {
        catsTotalMap.set(cat, (catsTotalMap.get(cat) ?? 0) + h);
      }
    }

    // Mostra TODOS os projetos (sem limite de top 8)
    const topProjetos: ResumoProjeto[] = Array.from(projTotalMap.entries())
      .sort((a, b) => b[1].horas - a[1].horas)
      .map(([nome, pv]) => ({
        nome,
        horas: Math.round(pv.horas * 10) / 10,
        // Mostra TODAS as atividades (sem limite de top 3)
        top3: Array.from(pv.descs.entries())
          .sort((a, b) => b[1].horas - a[1].horas)
          .map(([desc, data]) => ({
            desc,
            horas: Math.round(data.horas * 10) / 10,
            tags: data.tags.size > 0 ? Array.from(data.tags) : undefined,
            tarefa: data.tarefa ?? undefined
          })),
      }));

    const catsTotal: Partial<Record<Categoria, number>> = {};
    for (const [cat, h] of Array.from(catsTotalMap.entries())) {
      (catsTotal as Record<string, number>)[cat] = Math.round(h * 10) / 10;
    }

    // Semanas finais com horas arredondadas
    const semanasFinais: SemanaColaborador[] = semanasOrdenadas.map((s) => {
      const horas = s.skip ? 0 : Math.round(s.effective * 10) / 10;
      const pct = meta && !s.skip ? Math.round((horas / meta) * 100) : 0;
      return {
        semana: s.semana,
        horas,
        pct,
        skip: s.skip,
        carnavalAuto: s.carnavalAuto,
        projetos: s.projetos,
        cats: s.cats,
      };
    });

    const semanasComDado = semanasFinais.filter((s) => !s.skip);
    const totalH = semanasComDado.reduce((acc, s) => acc + s.horas, 0);
    const n = semanasComDado.length;
    const mediaHoras = n ? Math.round((totalH / n) * 10) / 10 : 0;
    const mediaPct = meta ? Math.round((mediaHoras / meta) * 100) : 0;

    colaboradores.push({
      nome,
      meta,
      mediaHoras,
      mediaPct,
      semanasAcima: semanasComDado.filter((s) => s.horas >= meta * 0.95).length,
      semanasAbaixo: semanasComDado.filter((s) => s.horas > 0 && s.horas < meta * 0.95).length,
      semanasAusente: semanasComDado.filter((s) => s.horas === 0).length,
      primeiraSemana,
      semanas: semanasFinais,
      topProjetos,
      catsTotal,
    });
  }

  // Ordena por % média decrescente
  colaboradores.sort((a, b) => b.mediaPct - a.mediaPct);

  // DEBUG: Log para verificar se tags estão nos dados
  const primeiroColab = colaboradores[0];
  if (primeiroColab && primeiroColab.topProjetos.length > 0) {
    const primeiroProjeto = primeiroColab.topProjetos[0];
    console.log('[DEBUG] Primeiro colaborador:', primeiroColab.nome);
    console.log('[DEBUG] Primeiro projeto:', primeiroProjeto.nome);
    console.log('[DEBUG] Primeira atividade:', JSON.stringify(primeiroProjeto.top3[0]));
    console.log('[DEBUG] Tem tags?', primeiroProjeto.top3[0].tags ? 'SIM' : 'NÃO');
    console.log('[DEBUG] Tem tarefa?', primeiroProjeto.top3[0].tarefa ? 'SIM' : 'NÃO');
  }

  const resultado: DadosDashboard = {
    atualizadoEm: new Date().toISOString(),
    workspace: "SETEG",
    todasSemanas,
    colaboradores,
  };

  // Salva no cache com a chave do período
  setCacheDados(resultado, chaveCache);
  return resultado;
}
