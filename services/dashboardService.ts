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

// ─── Sem cache em memória ─────────────────────────────────────────────────────
// Em ambiente serverless (Vercel), o cache global não é confiável pois cada
// instância tem sua própria memória. Removido para garantir que desativações
// e ativações no Clockify reflitam imediatamente ao clicar em Atualizar.

export function getCacheDados(_chave: string, _force: boolean = false): DadosDashboard | null {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setCacheDados(_dados: DadosDashboard, _chave: string) {
  // sem cache
}

export function invalidarCache() {
  // sem cache
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

/**
 * Normaliza nome para comparação (remove acentos, converte para maiúsculas)
 */
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

// ─── Busca de dados brutos ────────────────────────────────────────────────────

async function buscarUsuarios(): Promise<ClockifyUser[]> {
  // Busca TODOS os usuários ACTIVE com paginação
  // Filtra também pelo campo status na resposta para garantir que usuários
  // recém-desativados não apareçam mesmo que a API ainda os retorne
  const todosUsuarios: ClockifyUser[] = [];
  let page = 1;
  
  while (true) {
    const r = await fetchFromClockify<ClockifyUser[]>(
      `/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=ACTIVE&page=${page}&page-size=200`,
      CLOCKIFY_API_TOKEN,
    );
    if ("status" in r) throw new Error(r.message);
    if (r.data.length === 0) break;
    // Filtra explicitamente pelo campo status para garantir consistência
    const apenasAtivos = r.data.filter((u) => u.status === "ACTIVE");
    todosUsuarios.push(...apenasAtivos);
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

export async function processarDashboard(startDate?: string, endDate?: string, force: boolean = false): Promise<DadosDashboard> {
  const hoje = new Date().toISOString().slice(0, 10);
  
  // Converte datas locais para UTC para enviar à API do Clockify
  // Exemplo: 2026-04-20T00:00:00 (UTC-3) → 2026-04-20T03:00:00Z (UTC)
  // Isso garante que todo o dia seja incluído na busca (00:00:00 até 23:59:59 local)
  const startLocal = new Date(`${startDate ?? START_DATE}T00:00:00`);
  const endLocal = new Date(`${endDate ?? hoje}T23:59:59`);
  const startISO = startLocal.toISOString();
  const endISO = endLocal.toISOString();
  
  const chaveCache = `v8-${startDate ?? START_DATE}|${endDate ?? hoje}`; // v8 - sem cache em memoria

  // Retorna do cache se ainda válido (10s) E não for force
  const cached = getCacheDados(chaveCache, force);
  if (cached) return cached;

  console.log('[API] Buscando dados da API do Clockify...');
  console.log(`[API] Datas locais: ${startDate ?? START_DATE} até ${endDate ?? hoje}`);
  console.log(`[API] Datas UTC: ${startISO} até ${endISO}`);
  console.log(`[API] Force: ${force}`);

  // Calcula segunda-feira da semana atual (baseada em hoje) para filtrar semanas futuras
  // Nota: Usa 'hoje' e não 'endDate' para garantir que a semana atual seja sempre incluída
  const segundaFeiraAtual = getSemana(`${hoje}T23:59:59Z`);

  // Busca usuários, projetos e tags em paralelo
  const [usuarios, projetos, tags] = await Promise.all([
    buscarUsuarios(), 
    buscarProjetos(),
    buscarTags()
  ]);

  console.log(`[API] Usuários ACTIVE retornados pelo Clockify (${usuarios.length}):`, usuarios.map(u => limparNome(u.name)).sort().join(', '));

  // Mapas de lookup - filtra apenas por EXCLUDE_USERS (blacklist)
  const mapaUsuarios = new Map(
    usuarios
      .filter((u) => {
        const nomeLimpo = limparNome(u.name);
        const nomeNormalizado = normalizarNome(nomeLimpo);

        // Exclui apenas usuários da lista EXCLUDE_USERS
        return !EXCLUDE_USERS.some((ex) => {
          const exNormalizado = normalizarNome(ex);
          // Correspondência exata
          if (nomeNormalizado === exNormalizado) return true;

          // Correspondência parcial (todas as palavras do excluído estão no nome)
          const palavrasEx = exNormalizado.split(/\s+/);
          const palavrasNome = nomeNormalizado.split(/\s+/);
          return palavrasEx.every((p) => palavrasNome.includes(p));
        });
      })
      .map((u) => [u.id, limparNome(u.name)]),
  );

  console.log('[DEBUG] Total de usuários buscados da API:', usuarios.length);
  console.log('[DEBUG] Usuários após filtro EXCLUDE_USERS:', mapaUsuarios.size);
  console.log('[DEBUG] Usuários incluídos:', Array.from(mapaUsuarios.values()).sort().join(', '));

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
    console.log(`[DEBUG] ${uname}: ${entradas.length} entradas encontradas no período`);
    
    // Log detalhado para TI
    if (uname.toLowerCase().includes("ti")) {
      console.log(`[DEBUG TI] Processando ${entradas.length} entradas...`);
      const hoje = new Date().toISOString().slice(0, 10);
      const entradaHoje = entradas.filter(e => e.timeInterval?.start?.startsWith(hoje));
      console.log(`[DEBUG TI] Entradas de HOJE (${hoje}): ${entradaHoje.length}`);
      if (entradaHoje.length > 0) {
        for (const e of entradaHoje) {
          console.log(`[DEBUG TI] Entrada:`, {
            start: e.timeInterval?.start,
            duration: e.timeInterval?.duration,
            desc: e.description?.substring(0, 50),
            projectId: e.projectId
          });
        }
      }
      // Log de TODAS as entradas de abril
      const entradasAbril = entradas.filter(e => e.timeInterval?.start?.startsWith("2026-04"));
      console.log(`[DEBUG TI] Total de entradas em ABRIL: ${entradasAbril.length}`);
    }
    
    // Log detalhado para Henrique
    if (uname.toLowerCase().includes("henrique")) {
      console.log(`[DEBUG HENRIQUE] Processando ${entradas.length} entradas...`);
      const hoje = new Date().toISOString().slice(0, 10);
      const entradaHoje = entradas.filter(e => e.timeInterval?.start?.startsWith(hoje));
      console.log(`[DEBUG HENRIQUE] Entradas de HOJE (${hoje}): ${entradaHoje.length}`);
      if (entradaHoje.length > 0) {
        for (const e of entradaHoje) {
          console.log(`[DEBUG HENRIQUE] Entrada:`, {
            start: e.timeInterval?.start,
            duration: e.timeInterval?.duration,
            desc: e.description?.substring(0, 50),
            projectId: e.projectId
          });
        }
      }
    }
    
    const semanas = new Map<string, BucketSemana>();

    for (const e of entradas) {
      const interval = e.timeInterval;
      if (!interval?.start) continue;

      const semana = getSemana(interval.start);
      const horas = parseDuration(interval.duration ?? "");
      const desc = (e.description ?? "").trim();
      const cliente = e.projectId ? (mapaProjetos.get(e.projectId) ?? "Sem Código Registrado") : "Sem Código Registrado";

      // Log detalhado para TI, Henrique e Laís
      const isTI = uname.toLowerCase().includes("ti") && !uname.toLowerCase().includes("cristina");
      const isHenrique = uname.toLowerCase().includes("henrique");
      const isLais = uname.toLowerCase().includes("laís") || uname.toLowerCase().includes("lais");
      
      if ((isTI || isHenrique || isLais) && interval.start.startsWith("2026-04")) {
        console.log(`[DEBUG ${uname.toUpperCase()}] Entrada de abril:`, {
          data: interval.start.slice(0, 10),
          semanaCalculada: semana,
          horas,
          desc: desc.substring(0, 50),
          isCarnaval: isCarnaval(desc),
          isFolga: isFolga(desc),
          isExcluida: isExcluida(desc),
          cliente
        });
      }

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

    // Primeira semana com algum dado (ou null se não tiver dados)
    const primeiraSemana = todasSemanas.find((s) => {
      const b = semanas.get(s);
      if (!b) return false;
      return b.work + b.folga + b.carnaval + b.absence > 0;
    });
    
    // Se não tem dados, cria colaborador com valores zerados
    if (!primeiraSemana) {
      console.log(`[DEBUG] Colaborador SEM DADOS no período: ${nome}`);
      
      // Cria semanas vazias para o colaborador
      const semanasVazias: SemanaColaborador[] = todasSemanas.map((s) => ({
        semana: s,
        horas: 0,
        pct: 0,
        skip: true,
        carnavalAuto: false,
        projetos: [],
        cats: {},
      }));
      
      colaboradores.push({
        nome,
        meta,
        mediaHoras: 0,
        mediaPct: 0,
        semanasAcima: 0,
        semanasAbaixo: 0,
        semanasAusente: todasSemanas.length,
        primeiraSemana: todasSemanas[0] || "",
        semanas: semanasVazias,
        topProjetos: [],
        catsTotal: {},
      });
      
      continue;
    }

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

  console.log('[DEBUG] Total de colaboradores no resultado final:', colaboradores.length);
  console.log('[DEBUG] Colaboradores incluídos:', colaboradores.map(c => c.nome).join(', '));

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

  // Salva no cache (10s)
  setCacheDados(resultado, chaveCache);
  return resultado;
}
