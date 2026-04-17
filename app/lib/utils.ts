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

/** Retorna o intervalo de datas (início e fim) de uma semana ISO 8601 */
export function intervaloSemanaISO(dataStr: string): { inicio: string; fim: string } {
  const d = new Date(dataStr + "T12:00:00Z");
  // Encontra a segunda-feira da semana (ISO 8601: semana começa na segunda)
  const diaSemana = d.getUTCDay();
  const diasAteSegunda = (diaSemana === 0 ? -6 : 1 - diaSemana);
  const segunda = new Date(d);
  segunda.setUTCDate(d.getUTCDate() + diasAteSegunda);
  
  // Domingo é 6 dias após a segunda
  const domingo = new Date(segunda);
  domingo.setUTCDate(segunda.getUTCDate() + 6);
  
  const formatarData = (date: Date) => {
    const ano = date.getUTCFullYear();
    const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(date.getUTCDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };
  
  return {
    inicio: formatarData(segunda),
    fim: formatarData(domingo),
  };
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

/** Converte horas decimais para formato HH:MM */
export function fmtHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
