// Utilitário para conversão de durações ISO 8601 para horas decimais

const REGEX_DURACAO = /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/;

/**
 * Converte string ISO 8601 de duração (ex: "PT1H30M") para horas decimais.
 * Retorna 0 para entradas inválidas ou vazias.
 */
export function parseDuration(iso: string): number {
  if (!iso || typeof iso !== "string") return 0;
  const m = REGEX_DURACAO.exec(iso.trim());
  if (!m) return 0;
  const h = parseFloat(m[1] ?? "0") || 0;
  const min = parseFloat(m[2] ?? "0") || 0;
  const s = parseFloat(m[3] ?? "0") || 0;
  return h + min / 60 + s / 3600;
}
