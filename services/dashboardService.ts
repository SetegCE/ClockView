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
}

// Cache global — sobrevive entre requisições no mesmo processo Node.js
const globalCache = global as typeof global & { _clockviewCache?: CacheEntry };

/** TTL do cache: 10 minutos */
const CACHE_TTL_MS = 10 * 60 * 1000;

export function getCacheDados(): DadosDashboard | null {
  const entry = globalCache._clockviewCache;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.dados;
}

function setCacheDados(dados: DadosDashboard) {
  globalCache._clockviewCache = { dados, timestamp: Date.now() };
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
  projetos: Map<string, Map<string, number>>; // cliente → desc → horas
  cats: Map<Categoria, number>;
}

function novoBucket(): BucketSemana {
  return { work: 0, folga: 0, carnaval: 0, absence: 0, projetos: new Map(), cats: new Map() };
}

// ─── Busca de dados brutos ────────────────────────────────────────────────────

async function buscarUsuarios(): Promise<ClockifyUser[]> {
  const r = await fetchFromClockify<ClockifyUser[]>(
    `/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?limit=200`,
    CLOCKIFY_API_TOKEN,
  );
  if ("status" in r) throw new Error(r.message);
  return r.data;
}

async function buscarProjetos(): Promise<ClockifyProject[]> {
  const r = await fetchFromClockify<ClockifyProject[]>(
    `/workspaces/${CLOCKIFY_WORKSPACE_ID}/projects?limit=500`,
    CLOCKIFY_API_TOKEN,
  );
  if ("status" in r) throw new Error(r.message);
  return r.data;
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

export async function processarDashboard(): Promise<DadosDashboard> {
  // Retorna do cache se ainda válido (evita rebuscar dentro de 10 minutos)
  const cached = getCacheDados();
  if (cached) return cached;

  const hoje = new Date().toISOString().slice(0, 10);
  const startISO = `${START_DATE}T00:00:00Z`;
  const endISO = `${hoje}T23:59:59Z`;

  // Busca usuários e projetos em paralelo
  const [usuarios, projetos] = await Promise.all([buscarUsuarios(), buscarProjetos()]);

  // Mapas de lookup
  const mapaUsuarios = new Map(
    usuarios
      .filter((u) => !EXCLUDE_USERS.includes(u.name))
      .map((u) => [u.id, u.name]),
  );
  const mapaProjetos = new Map(
    projetos.map((p) => [p.id, p.clientName || "SETEG (interno)"]),
  );

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
      const cliente = mapaProjetos.get(e.projectId ?? "") ?? "SETEG (interno)";

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
        if (!bucket.projetos.has(cliente)) bucket.projetos.set(cliente, new Map());
        const descMap = bucket.projetos.get(cliente)!;
        descMap.set(desc, (descMap.get(desc) ?? 0) + horas);
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

  // Coleta todas as semanas disponíveis
  const todasSemanasSet = new Set<string>();
  for (const semanas of Array.from(raw.values())) {
    for (const s of Array.from(semanas.keys())) todasSemanasSet.add(s);
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
      if (s < primeiraSemana) {
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
        const vals = Array.from(descMap.values()) as number[];
        const totalH = vals.reduce((a: number, v: number) => a + v, 0);
        const entries = Array.from(descMap.entries()) as [string, number][];
        const top3 = entries
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([desc, horas]) => ({ desc, horas: Math.round(horas * 10) / 10 }));
        projetosList.push({ nome: cliente, horas: Math.round(totalH * 10) / 10, top3 });
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

    // Projetos totais do período
    const projTotalMap = new Map<string, { horas: number; descs: Map<string, number> }>();
    const catsTotalMap = new Map<Categoria, number>();

    for (const s of semanasOrdenadas) {
      for (const pr of s.projetos) {
        if (!projTotalMap.has(pr.nome)) projTotalMap.set(pr.nome, { horas: 0, descs: new Map() });
        const pt = projTotalMap.get(pr.nome)!;
        pt.horas += pr.horas;
        for (const t of pr.top3) {
          pt.descs.set(t.desc, (pt.descs.get(t.desc) ?? 0) + t.horas);
        }
      }
      for (const [cat, h] of Object.entries(s.cats) as [Categoria, number][]) {
        catsTotalMap.set(cat, (catsTotalMap.get(cat) ?? 0) + h);
      }
    }

    const topProjetos: ResumoProjeto[] = Array.from(projTotalMap.entries())
      .sort((a, b) => b[1].horas - a[1].horas)
      .slice(0, 8)
      .map(([nome, pv]) => ({
        nome,
        horas: Math.round(pv.horas * 10) / 10,
        top3: Array.from(pv.descs.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([desc, horas]) => ({ desc, horas: Math.round(horas * 10) / 10 })),
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

  const resultado: DadosDashboard = {
    atualizadoEm: new Date().toISOString(),
    workspace: "SETEG",
    todasSemanas,
    colaboradores,
  };

  // Salva no cache
  setCacheDados(resultado);
  return resultado;
}
