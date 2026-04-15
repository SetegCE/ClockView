"use client";

// Header client-side — lê o pathname via usePathname para exibir o título correto

import { usePathname } from "next/navigation";
import { useDados } from "@/app/context/DadosContext";

const TITULOS: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/colaboradores": "Colaboradores",
  "/projetos":      "Projetos",
  "/calendario":    "Calendário",
};

export default function HeaderClient() {
  const pathname = usePathname();
  const { dados, atualizando, erro, atualizar } = useDados();

  const titulo = TITULOS[pathname] ?? "ClockView";

  const tsAtualizado = dados
    ? new Date(dados.atualizadoEm).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <header className="cv-header">
      <div className="cv-header-brand">
        <div className="cv-header-title">{titulo}</div>
      </div>
      <div className="cv-header-right">
        {tsAtualizado && (
          <span className="cv-header-ts">Atualizado {tsAtualizado}</span>
        )}
        <div className={`cv-status-dot${atualizando ? " updating" : erro ? " error" : ""}`} />
        <button
          className="cv-btn-update"
          disabled={atualizando}
          onClick={() => atualizar(true)}
        >
          <i className={`bi bi-arrow-clockwise${atualizando ? " spin" : ""}`} />
          {atualizando ? "Atualizando…" : "Atualizar"}
        </button>
      </div>
    </header>
  );
}
