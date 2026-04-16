"use client";

// Página /colaboradores — Cards detalhados de cada colaborador

import { useState } from "react";
import { useDados } from "@/app/context/DadosContext";
import { Loading, Erro } from "@/app/components/LoadingErro";
import { PCOLS, CAT_CONFIG } from "@/app/lib/constants";
import { badgeClass, fmt, trunc, iniciais } from "@/app/lib/utils";
import type { Categoria } from "@/lib/types";

export default function PageColaboradores() {
  const { dados, carregando, erro } = useDados();
  const [expandido, setExpandido] = useState<string | null>(null);

  if (carregando) return <Loading />;
  if (erro) return <Erro mensagem={erro} />;
  if (!dados) return null;

  const lista = [...dados.colaboradores].sort((a, b) => b.mediaPct - a.mediaPct);

  return (
    <div className="cv-col" style={{ overflow: "auto" }}>
      <div className="cv-inner">
        {/* Legenda unificada — cores do heatmap + indicadores de semanas */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Linha 1: cores */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Média semanal</span>
            {[
              { bg: "#00C48C", label: "≥ 100%" },
              { bg: "#3B6D11", label: "≥ 95%" },
              { bg: "#EF9F27", label: "≥ 75%" },
              { bg: "#D85A30", label: "≥ 50%" },
              { bg: "#A32D2D", label: "< 50%" },
              { bg: "#D3D1C7", label: "Sem dado" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 14, height: 9, borderRadius: 3, background: l.bg, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Divisor */}
          <div style={{ height: 1, background: "#f1f5f9" }} />

          {/* Linha 2: indicadores */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Indicadores</span>
            {[
              { icon: "bi-arrow-up-circle-fill", color: "#00C48C", label: "Acima da meta", desc: "semanas com ≥ 95% das horas" },
              { icon: "bi-arrow-down-circle-fill", color: "#EF9F27", label: "Abaixo da meta", desc: "semanas com registro < 95%" },
              { icon: "bi-dash-circle-fill", color: "#94a3b8", label: "Sem registro", desc: "semanas sem apontamento" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: 13, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{item.label}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>— {item.desc}</span>
              </div>
            ))}
            <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>Clique em um card para expandir detalhes</span>
          </div>
        </div>

        <div className="cv-colab-grid">
          {lista.map((colab) => {
            const aberto = expandido === colab.nome;
            const maxProj = colab.topProjetos.length > 0 ? colab.topProjetos[0].horas : 1;
            const totalCats = Object.values(colab.catsTotal).reduce((a, v) => a + (v ?? 0), 0) || 1;

            // Cor baseada no percentual — usada na barra e no badge
            const corPct = colab.mediaPct >= 95 ? "#00C48C"
              : colab.mediaPct >= 75 ? "#3B6D11"
              : colab.mediaPct >= 50 ? "#EF9F27"
              : "#A32D2D";

            return (
              <div
                key={colab.nome}
                className={`cv-colab-card${aberto ? " expanded" : ""}`}
                onClick={() => setExpandido(aberto ? null : colab.nome)}
              >
                <div className="cv-colab-header">
                  <div className="cv-avatar" style={{ width: 40, height: 40, fontSize: 13 }}>
                    {iniciais(colab.nome)}
                  </div>
                  <div className="cv-colab-info">
                    <div className="cv-colab-name">{colab.nome}</div>
                    <div className="cv-progress-bg">
                      <div
                        className="cv-progress-fill"
                        style={{
                          width: `${Math.min(colab.mediaPct, 100)}%`,
                          background: corPct,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="cv-badge"
                    style={{ background: corPct }}
                  >
                    {colab.mediaPct}%
                  </span>
                </div>

                <div className="cv-colab-meta-row">
                  {/* Meta */}
                  <div className="cv-colab-stat">
                    <span className="cv-colab-stat-val">{colab.meta}h</span>
                    <span className="cv-colab-stat-label">Meta semanal</span>
                  </div>

                  {/* Separador */}
                  <div style={{ width: 1, background: "#f1f5f9", alignSelf: "stretch", margin: "0 4px" }} />

                  {/* Média com destaque visual */}
                  <div className="cv-colab-stat">
                    <span className="cv-colab-stat-val" style={{ color: corPct, fontSize: 16 }}>
                      {fmt(colab.mediaHoras)}h
                    </span>
                    <span className="cv-colab-stat-label">Média/semana</span>
                  </div>

                  {/* Separador */}
                  <div style={{ width: 1, background: "#f1f5f9", alignSelf: "stretch", margin: "0 4px" }} />

                  {/* Acima */}
                  <div className="cv-colab-stat" title="Semanas com ≥ 95% da meta">
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <i className="bi bi-arrow-up-circle-fill" style={{ color: "#00C48C", fontSize: 12 }} />
                      <span className="cv-colab-stat-val" style={{ color: "#00C48C" }}>{colab.semanasAcima}</span>
                    </div>
                    <span className="cv-colab-stat-label">Acima da meta</span>
                  </div>

                  {/* Abaixo */}
                  <div className="cv-colab-stat" title="Semanas com registro mas abaixo de 95% da meta">
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <i className="bi bi-arrow-down-circle-fill" style={{ color: "#EF9F27", fontSize: 12 }} />
                      <span className="cv-colab-stat-val" style={{ color: "#EF9F27" }}>{colab.semanasAbaixo}</span>
                    </div>
                    <span className="cv-colab-stat-label">Abaixo da meta</span>
                  </div>

                  {/* Ausente */}
                  <div className="cv-colab-stat" title="Semanas sem nenhum registro de horas">
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <i className="bi bi-dash-circle-fill" style={{ color: "#94a3b8", fontSize: 12 }} />
                      <span className="cv-colab-stat-val" style={{ color: "#94a3b8" }}>{colab.semanasAusente}</span>
                    </div>
                    <span className="cv-colab-stat-label">Sem registro</span>
                  </div>
                </div>

                {aberto && (
                  <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                    {colab.topProjetos.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div className="cv-section-title" style={{ marginBottom: 8 }}>Top projetos</div>
                        {colab.topProjetos.slice(0, 5).map((proj, idx) => (
                          <div key={proj.nome} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 13, color: "#475569" }}>{trunc(proj.nome, 30)}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: PCOLS[idx % PCOLS.length] }}>
                                {fmt(proj.horas)}h
                              </span>
                            </div>
                            <div className="cv-proj-bar-bg">
                              <div
                                className="cv-proj-bar-fill"
                                style={{ width: `${Math.round((proj.horas / maxProj) * 100)}%`, background: PCOLS[idx % PCOLS.length] }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <div className="cv-section-title" style={{ marginBottom: 8 }}>Categorias</div>
                      {(Object.keys(CAT_CONFIG) as Categoria[]).map((cat) => {
                        const h = colab.catsTotal[cat] ?? 0;
                        if (h === 0) return null;
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
