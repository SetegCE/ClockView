"use client";

// Painel lateral de detalhes de um colaborador (usado no Dashboard)

import { useState } from "react";
import type { Colaborador, Categoria } from "@/lib/types";
import { PCOLS, CAT_CONFIG } from "@/app/lib/constants";
import { fmt, fmtDataLonga, trunc } from "@/app/lib/utils";

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

  return (
    <aside className="cv-panel">
      <div className="cv-panel-header">
        <div>
          <div className="cv-panel-name">
            {semana ? `Semana de ${fmtDataLonga(semana)}` : "Resumo geral"}
          </div>
          <div className="cv-panel-title">{colaborador.nome}</div>
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
                  <span className="cv-cat-value">{fmt(h)}h</span>
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
                  <span className="cv-proj-hours" style={{ color: cor }}>{fmt(proj.horas)}h</span>
                </div>
                <div className="cv-proj-bar-bg">
                  <div
                    className="cv-proj-bar-fill"
                    style={{ width: `${Math.round((proj.horas / maxProj) * 100)}%`, background: cor }}
                  />
                </div>
                {aberto && proj.top3.length > 0 && (
                  <div className="cv-activities">
                    {proj.top3.map((t, i) => (
                      <div key={i} className="cv-activity">
                        <span className="cv-activity-desc">{trunc(t.desc, 40)}</span>
                        <span className="cv-activity-hours">{fmt(t.horas)}h</span>
                      </div>
                    ))}
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
