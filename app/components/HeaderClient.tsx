"use client";

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
  const { dados, atualizando, erro, atualizar, periodoInicio, periodoFim, setPeriodoInicio, setPeriodoFim } = useDados();

  const titulo = TITULOS[pathname] ?? "Bem-Te-View";

  const tsAtualizado = dados
    ? new Date(dados.atualizadoEm).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const inputStyle: React.CSSProperties = {
    fontSize: 13,
    padding: "5px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontFamily: "inherit",
    color: "#334155",
    background: "#f8fafc",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <header className="cv-header">
      <div className="cv-header-brand">
        <div className="cv-header-title">{titulo}</div>
      </div>
      <div className="cv-header-right">
        {/* Seletor de período */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>De</span>
          <input
            type="date"
            value={periodoInicio}
            onChange={(e) => setPeriodoInicio(e.target.value)}
            style={inputStyle}
          />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>até</span>
          <input
            type="date"
            value={periodoFim}
            onChange={(e) => setPeriodoFim(e.target.value)}
            style={inputStyle}
          />
        </div>

        {tsAtualizado && (
          <span 
            className="cv-header-ts" 
            title="Os dados são atualizados automaticamente a cada hora"
          >
            Atualizado {tsAtualizado}
            <i 
              className="bi bi-clock-history" 
              style={{ 
                marginLeft: 6, 
                fontSize: 11, 
                color: "#94a3b8",
                cursor: "help"
              }} 
            />
          </span>
        )}
        <div className={`cv-status-dot${atualizando ? " updating" : erro ? " error" : ""}`} />
        <button
          className="cv-btn-update"
          disabled={atualizando}
          onClick={() => atualizar(true)}
          title="Clique para buscar dados frescos da API do Clockify"
        >
          <i className={`bi bi-arrow-clockwise${atualizando ? " spin" : ""}`} />
          {atualizando ? "Atualizando…" : "Atualizar"}
        </button>
      </div>
    </header>
  );
}
