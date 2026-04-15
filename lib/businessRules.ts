// Regras de negócio da SETEG para classificação e processamento de entradas de tempo

import type { Categoria } from "./types";
import {
  EXCLUDE_DESCRIPTIONS,
  FOLGA_KEYWORDS,
  CARNAVAL_KEYWORDS,
} from "@/config/clockify";

/** Verifica se a descrição indica folga compensada */
export function isFolga(desc: string): boolean {
  const d = desc.toUpperCase();
  return FOLGA_KEYWORDS.some((k) => d.includes(k));
}

/** Verifica se a descrição indica carnaval */
export function isCarnaval(desc: string): boolean {
  const d = desc.toUpperCase();
  return CARNAVAL_KEYWORDS.some((k) => d.includes(k));
}

/** Verifica se a descrição deve ser excluída do cálculo de horas trabalhadas */
export function isExcluida(desc: string): boolean {
  if (isFolga(desc) || isCarnaval(desc)) return true;
  const d = desc.toUpperCase();
  return EXCLUDE_DESCRIPTIONS.some((k) => d.includes(k));
}

/** Classifica a atividade em uma das 4 categorias da SETEG */
export function categorizar(desc: string): Categoria {
  const d = desc.toUpperCase();

  if (
    d.includes("CAMPO |") || d.includes("| CAMPO") ||
    d.includes("PRE CAMPO") || d.includes("PRE-CAMPO") ||
    d.includes("DESLOCAMENTO")
  ) return "campo";

  if (
    d.includes("REUNIAO") || d.includes("KICKOFF") ||
    d.includes("KICK-OFF") || d.includes("APRESENTACAO") ||
    d.includes("VIA TEAMS")
  ) return "reuniao";

  if (
    d.includes("RELATORIO") || d.includes("RELATORIA") ||
    d.includes("GEOMAP") || d.includes("CORRECAO") ||
    d.includes("POS-CAMPO") || d.includes("POS CAMPO") ||
    d.includes("TRANSCRICAO") || d.includes("ANALISE") ||
    d.includes("ELABORACAO") || d.includes("MONITORAMENTO") ||
    d.includes("FAUNA ATROPELADA") || d.includes("PROGRAMA DE FAUNA") ||
    d.includes("ATIVIDADE ESG") || d.includes("ATIVIDADES ESG") ||
    d.includes("ATIVIDADES REGULATORIAS") || d.includes("ATIVIDADE REGULATORIA") ||
    d.includes("ESTUDO") || d.includes("REVISAO") ||
    d.includes("INVENTARIO") || d.includes("QGIS") ||
    d.includes("PGRS") || d.includes("PGRCC") ||
    d.includes("PRAD") || d.includes("RADA") ||
    d.includes("EIA") || d.includes("RIMA") ||
    d.includes("AUDITORIA") || d.includes("MAPA") ||
    d.includes("MY ESG |") || d.includes("BI GESTAO") ||
    d.includes("PRODUCAO DO MATERIAL") || d.includes("PRODUCAO NO QGIS")
  ) return "escritorio";

  return "gerenciamento";
}

/** Retorna a segunda-feira da semana de uma data ISO */
export function getSemana(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 10) + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0=dom, 1=seg...
  const diasDesdeSegunda = dow === 0 ? 6 : dow - 1;
  const segunda = new Date(d);
  segunda.setUTCDate(d.getUTCDate() - diasDesdeSegunda);
  return segunda.toISOString().slice(0, 10);
}
