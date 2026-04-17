"use client";

// Página /colaboradores — Cards detalhados de cada colaborador

import { useState } from "react";
import { useDados } from "@/app/context/DadosContext";
import { Loading, Erro } from "@/app/components/LoadingErro";
import { PCOLS, CAT_CONFIG } from "@/app/lib/constants";
import { badgeClass, fmt, fmtHoras, trunc, iniciais } from "@/app/lib/utils";
import type { Categoria } from "@/lib/types";

export default function PageColaboradores() {
  const { dados, carregando, erro } = useDados();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"nome" | "mediaPct" | "mediaHoras">("nome");

  if (carregando) return <Loading />;
  if (erro) return <Erro mensagem={erro} />;
  if (!dados) return null;

  const lista = [...dados.colaboradores]
    .filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => {
      if (ordem === "nome") return a.nome.localeCompare(b.nome);
      if (ordem === "mediaHoras") return b.mediaHoras - a.mediaHoras;
      return b.mediaPct - a.mediaPct;
    });

  return (
    <div className="cv-col" style={{ overflow: "auto" }}>
      <div className="cv-inner">
        {/* Legenda unificada — cores do heatmap + indicadores de semanas */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Linha 1: cores + texto (direita) */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Média semanal</span>
            {[
              { bg: "#D3D1C7", label: "Sem dados" },
              { bg: "#E24B4A", label: "≤ 50%" },
              { bg: "#EF9F27", label: "≤ 80%" },
              { bg: "#3B6D11", label: "> 80%" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 14, height: 9, borderRadius: 3, background: l.bg, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
            <span style={{ fontSize: 11, color: "#94a3b8" }}>— Clique em um card para expandir detalhes</span>
          </div>

          {/* Divisor */}
          <div style={{ height: 1, background: "#f1f5f9" }} />

          {/* Linha 2: busca + ordenação (esquerda) | indicadores (direita) */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "space-between" }}>
            {/* Campo de busca e ordenação à esquerda */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    fontSize: 13, padding: "7px 12px 7px 32px",
                    border: "1px solid #e2e8f0", borderRadius: 8,
                    fontFamily: "inherit", color: "#334155", background: "#fff",
                    outline: "none", width: 220,
                  }}
                />
              </div>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as "nome" | "mediaPct" | "mediaHoras")}
                style={{
                  fontSize: 13, padding: "7px 12px",
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  fontFamily: "inherit", color: "#334155", background: "#fff",
                  outline: "none", cursor: "pointer",
                }}
              >
                <option value="nome">Ordenar por nome</option>
                <option value="mediaPct">Ordenar por %</option>
                <option value="mediaHoras">Ordenar por horas</option>
              </select>
            </div>
            
            {/* Indicadores à direita */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginLeft: "auto" }}>
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
            </div>
          </div>
        </div>

        <div className="cv-colab-grid">
          {lista.map((colab) => {
            const aberto = expandido === colab.nome;
            const maxProj = colab.topProjetos.length > 0 ? colab.topProjetos[0].horas : 1;
            const totalCats = Object.values(colab.catsTotal).reduce((a, v) => a + (v ?? 0), 0) || 1;

            // Cor baseada no percentual — usada na barra e no badge
            const corPct = colab.mediaPct > 80 ? "#3B6D11"
              : colab.mediaPct > 50 ? "#EF9F27"
              : "#E24B4A";

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
                    <span className="cv-colab-stat-val">{fmtHoras(colab.meta)}</span>
                    <span className="cv-colab-stat-label">Meta semanal</span>
                  </div>

                  {/* Separador */}
                  <div style={{ width: 1, background: "#f1f5f9", alignSelf: "stretch", margin: "0 4px" }} />

                  {/* Média com destaque visual */}
                  <div className="cv-colab-stat">
                    <span className="cv-colab-stat-val" style={{ color: corPct, fontSize: 16 }}>
                      {fmtHoras(colab.mediaHoras)}
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
                                {fmtHoras(proj.horas)}
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
                              <span className="cv-cat-value">{fmtHoras(h)}</span>
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
