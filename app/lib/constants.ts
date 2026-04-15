// Constantes compartilhadas entre os componentes do ClockView

import type { Categoria } from "@/lib/types";

export const PCOLS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#84cc16", "#f97316",
];

export const CAT_CONFIG: Record<Categoria, { label: string; color: string }> = {
  escritorio:    { label: "Escritório",    color: "#6366f1" },
  gerenciamento: { label: "Gerenciamento", color: "#64748b" },
  campo:         { label: "Campo",         color: "#10b981" },
  reuniao:       { label: "Reunião",       color: "#f59e0b" },
};
