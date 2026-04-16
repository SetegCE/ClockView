// Funções utilitárias compartilhadas entre os componentes do ClockView

/** Retorna cor de fundo e texto para uma célula do heatmap */
export function corCelula(horas: number, meta: number): { bg: string; fg: string } {
  if (horas === 0) return { bg: "#D3D1C7", fg: "#5F5E5A" };
  const pct = horas / meta;
  if (pct >= 1.0)  return { bg: "#00C48C", fg: "#FFFFFF" };
  if (pct >= 0.95) return { bg: "#3B6D11", fg: "#FFFFFF" };
  if (pct >= 0.75) return { bg: "#EF9F27", fg: "#FFFFFF" };
  if (pct >= 0.5)  return { bg: "#D85A30", fg: "#FFFFFF" };
  return                  { bg: "#A32D2D", fg: "#FFFFFF" };
}

/** Retorna classe CSS do badge conforme percentual */
export function badgeClass(pct: number): string {
  if (pct >= 95) return "cv-badge green";
  if (pct >= 75) return "cv-badge blue";
  return "cv-badge red";
}

/** Formata número com 1 casa decimal */
export function fmt(n: number): string {
  return n.toFixed(1);
}

/** Formata data YYYY-MM-DD → DD/MM */
export function fmtData(s: string): string {
  if (!s || s.length < 10) return s;
  return `${s.slice(8, 10)}/${s.slice(5, 7)}`;
}

/** Formata data YYYY-MM-DD → "DD de MMM" */
export function fmtDataLonga(s: string): string {
  if (!s || s.length < 10) return s;
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun",
                  "jul", "ago", "set", "out", "nov", "dez"];
  const dia = parseInt(s.slice(8, 10), 10);
  const mes = parseInt(s.slice(5, 7), 10) - 1;
  return `${dia} de ${meses[mes]}`;
}

/** Trunca string com reticências */
export function trunc(s: string, n = 28): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** Retorna iniciais do nome (máx 2 letras) */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
