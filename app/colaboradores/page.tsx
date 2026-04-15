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
        {/* Legenda de cores — mesma paleta do heatmap */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "10px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", flexWrap: "wrap" }}>
          {[
            { bg: "#042C53", label: "≥ 100%" },
            { bg: "#185FA5", label: "≥ 95%" },
            { bg: "#0F6E56", label: "≥ 75%" },
            { bg: "#EF9F27", label: "≥ 50%" },
            { bg: "#E24B4A", label: "< 50%" },
            { bg: "#D3D1C7", label: "Sem dado" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 9, borderRadius: 3, background: l.bg, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>Clique em um card para expandir detalhes</span>
        </div>

        <div className="cv-colab-grid">
          {lista.map((colab) => {
            const aberto = expandido === colab.nome;
            const maxProj = colab.topProjetos.length > 0 ? colab.topProjetos[0].horas : 1;
            const totalCats = Object.values(colab.catsTotal).reduce((a, v) => a + (v ?? 0), 0) || 1;

            // Cor baseada no percentual — usada na barra e no badge
            const corPct = colab.mediaPct >= 95 ? "#042C53"
              : colab.mediaPct >= 75 ? "#185FA5"
              : colab.mediaPct >= 50 ? "#EF9F27"
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
                  {[
                    { val: `${colab.meta}h`, label: "Meta" },
                    { val: `${fmt(colab.mediaHoras)}h`, label: "Média" },
                    { val: colab.semanasAcima, label: "Acima", color: "#042C53" },
                    { val: colab.semanasAbaixo, label: "Abaixo", color: "#EF9F27" },
                    { val: colab.semanasAusente, label: "Ausente", color: "#94a3b8" },
                  ].map((s) => (
                    <div key={s.label} className="cv-colab-stat">
                      <span className="cv-colab-stat-val" style={s.color ? { color: s.color } : undefined}>
                        {s.val}
                      </span>
                      <span className="cv-colab-stat-label">{s.label}</span>
                    </div>
                  ))}
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
