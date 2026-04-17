"use client";

// Painel lateral de detalhes de um colaborador (usado no Dashboard)

import { useState } from "react";
import type { Colaborador, Categoria } from "@/lib/types";
import { PCOLS, CAT_CONFIG } from "@/app/lib/constants";
import { fmt, fmtDataLonga, fmtData, fmtHoras, trunc, numeroSemanaISO, intervaloSemanaISO } from "@/app/lib/utils";

interface PainelDetalhesProps {
  colaborador: Colaborador;
  semana: string | null;
  onFechar: () => void;
}

export default function PainelDetalhes({ colaborador, semana, onFechar }: PainelDetalhesProps) {
  const [projetoAberto, setProjetoAberto] = useState<string | null>(null);

  const dadosSemana = semana
    ? colaborador.semanas.find((s) => s.semana === semana)
    : null;

  const projetos = dadosSemana ? dadosSemana.projetos : colaborador.topProjetos;
  const cats = dadosSemana ? dadosSemana.cats : colaborador.catsTotal;
  const maxProj = projetos.length > 0 ? projetos[0].horas : 1;
  const totalCats = Object.values(cats).reduce((a, v) => a + (v ?? 0), 0) || 1;

  // Informações da semana
  let tituloSemana = "Resumo geral";
  let subtituloSemana = "";
  if (semana) {
    const numSemana = numeroSemanaISO(semana);
    const { inicio, fim } = intervaloSemanaISO(semana);
    tituloSemana = `Semana ${numSemana}`;
    subtituloSemana = `${fmtData(inicio)} a ${fmtData(fim)}`;
  }

  return (
    <aside className="cv-panel">
      <div className="cv-panel-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: "#94a3b8", 
            textTransform: "uppercase", 
            letterSpacing: "0.08em",
            marginBottom: 4
          }}>
            {tituloSemana}
          </div>
          {subtituloSemana && (
            <div style={{ 
              fontSize: 12, 
              color: "#64748b", 
              marginBottom: 8,
              fontWeight: 500
            }}>
              {subtituloSemana}
            </div>
          )}
          <div style={{ 
            fontSize: 16, 
            fontWeight: 700, 
            color: "#1e293b",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block"
          }}>
            {colaborador.nome}
          </div>
        </div>
        <button className="cv-panel-close" onClick={onFechar} aria-label="Fechar painel">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="cv-panel-body">
        {/* Categorias */}
        <div>
          <div className="cv-section-title">Categorias</div>
          {(Object.keys(CAT_CONFIG) as Categoria[]).map((cat) => {
            const h = cats[cat] ?? 0;
            const pct = Math.round((h / totalCats) * 100);
            const cfg = CAT_CONFIG[cat];
            return (
              <div key={cat} className="cv-cat-row">
                <div className="cv-cat-header">
                  <span className="cv-cat-label">{cfg.label}</span>
                  <span className="cv-cat-value">{fmtHoras(h)}</span>
                </div>
                <div className="cv-bar-bg">
                  <div className="cv-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Projetos */}
        <div>
          <div className="cv-section-title">Projetos</div>
          {projetos.length === 0 && <div className="cv-empty">Nenhum projeto registrado</div>}
          {projetos.map((proj, idx) => {
            const cor = PCOLS[idx % PCOLS.length];
            const aberto = projetoAberto === proj.nome;
            return (
              <button
                key={proj.nome}
                className={`cv-proj-btn${aberto ? " active" : ""}`}
                onClick={() => setProjetoAberto(aberto ? null : proj.nome)}
              >
                <div className="cv-proj-header">
                  <span className="cv-proj-name" title={proj.nome}>{trunc(proj.nome)}</span>
                  <span className="cv-proj-hours" style={{ color: cor }}>{fmtHoras(proj.horas)}</span>
                </div>
                <div className="cv-proj-bar-bg">
                  <div
                    className="cv-proj-bar-fill"
                    style={{ width: `${Math.round((proj.horas / maxProj) * 100)}%`, background: cor }}
                  />
                </div>
                {aberto && proj.top3.length > 0 && (
                  <div className="cv-activities">
                    {proj.top3.map((t, i) => {
                      // DEBUG: Log para verificar se tags estão presentes
                      if (i === 0) console.log('[DEBUG] Atividade:', t);
                      
                      return (
                      <div key={i} className="cv-activity">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span className="cv-activity-desc">{trunc(t.desc, 40)}</span>
                          {t.tarefa && (
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                              <i className="bi bi-check2-square" style={{ marginRight: 4 }} />
                              {t.tarefa}
                            </div>
                          )}
                          {t.tags && t.tags.length > 0 && (
                            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                              {t.tags.map((tag, idx) => (
                                <span 
                                  key={idx}
                                  style={{
                                    fontSize: 9,
                                    padding: "2px 6px",
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                    borderRadius: 4,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                  }}
                                >
                                  {tag.replace(/^00_/, '')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="cv-activity-hours">{fmtHoras(t.horas)}</span>
                      </div>
                    )})}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
