// Funções utilitárias compartilhadas entre os componentes do ClockView

/** Retorna cor de fundo e texto para uma célula do heatmap — paleta semáforo */
export function corCelula(horas: number, meta: number): { bg: string; fg: string } {
  if (horas === 0) return { bg: "#D3D1C7", fg: "#5F5E5A" };
  const pct = (horas / meta) * 100;
  if (pct > 80)  return { bg: "#3B6D11", fg: "#FFFFFF" }; // verde
  if (pct > 50)  return { bg: "#EF9F27", fg: "#FFFFFF" }; // amarelo
  return              { bg: "#E24B4A", fg: "#FFFFFF" };    // vermelho
}

/** Retorna o número da semana ISO 8601 para uma data YYYY-MM-DD */
export function numeroSemanaISO(dataStr: string): number {
  const d = new Date(dataStr + "T12:00:00Z");
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const inicioSemana1 = new Date(jan4);
  inicioSemana1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const diff = d.getTime() - inicioSemana1.getTime();
  const semana = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  // Trata semanas do ano anterior/próximo
  if (semana < 1) return numeroSemanaISO(`${d.getUTCFullYear() - 1}-12-31`);
  return semana;
}

/** Retorna classe CSS do badge conforme percentual — paleta semáforo */
export function badgeClass(pct: number): string {
  if (pct > 80) return "cv-badge green";
  if (pct > 50) return "cv-badge yellow";
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
