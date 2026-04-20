"use client";

// Página /projetos — Lista de projetos com painel de detalhes lateral

import { useState } from "react";
import { useDados } from "@/app/context/DadosContext";
import { Loading, Erro } from "@/app/components/LoadingErro";
import { PCOLS } from "@/app/lib/constants";
import { fmt, fmtHoras, trunc, iniciais } from "@/app/lib/utils";

interface ProjetoAgregado {
  nome: string;
  totalHoras: number;
  colaboradores: { nome: string; horas: number }[];
}

export default function PageProjetos() {
  const { dados, carregando, erro } = useDados();
  const [projetoSelecionado, setProjetoSelecionado] = useState<string | null>(null);
  const [colaboradorExpandido, setColaboradorExpandido] = useState<string | null>(null);

  if (carregando) return <Loading />;
  if (erro) return <Erro mensagem={erro} />;
  if (!dados) return null;

  // Agrega projetos de todos os colaboradores
  const mapaProj = new Map<string, ProjetoAgregado>();
  for (const colab of dados.colaboradores) {
    for (const proj of colab.topProjetos) {
      if (!mapaProj.has(proj.nome)) {
        mapaProj.set(proj.nome, { nome: proj.nome, totalHoras: 0, colaboradores: [] });
      }
      const ag = mapaProj.get(proj.nome)!;
      ag.totalHoras += proj.horas;
      ag.colaboradores.push({ nome: colab.nome, horas: proj.horas });
    }
  }

  const projetos = Array.from(mapaProj.values()).sort((a, b) => b.totalHoras - a.totalHoras);
  const maxHoras = projetos.length > 0 ? projetos[0].totalHoras : 1;
  const totalGeralHoras = projetos.reduce((s, p) => s + p.totalHoras, 0);

  const proj = projetoSelecionado ? mapaProj.get(projetoSelecionado) ?? null : null;
  const colabsOrdenados = proj ? [...proj.colaboradores].sort((a, b) => b.horas - a.horas) : [];
  const maxColabHoras = colabsOrdenados.length > 0 ? colabsOrdenados[0].horas : 1;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Lista de projetos — layout fixo, só a tabela rola */}
      <div style={{ flex: 1, overflow: "hidden", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Cards de resumo — fixos no topo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, flexShrink: 0 }}>
          <div className="cv-card">
            <div>
              <div className="cv-card-label">Total de projetos</div>
              <div className="cv-card-value">{projetos.length}</div>
              <div className="cv-card-sub">clientes / projetos</div>
            </div>
            <div className="cv-card-icon" style={{ background: "#ff8200" }}>
              <i className="bi bi-folder2-open" />
            </div>
          </div>
          <div className="cv-card">
            <div>
              <div className="cv-card-label">Total de horas</div>
              <div className="cv-card-value">{fmtHoras(totalGeralHoras)}</div>
              <div className="cv-card-sub">em todos os projetos</div>
            </div>
            <div className="cv-card-icon" style={{ background: "#ff8200" }}>
              <i className="bi bi-clock-fill" />
            </div>
          </div>
          <div className="cv-card">
            <div>
              <div className="cv-card-label">Maior projeto</div>
              <div className="cv-card-value" style={{ fontSize: 18, marginTop: 6 }}>
                {projetos.length > 0 ? trunc(projetos[0].nome, 20) : "—"}
              </div>
              <div className="cv-card-sub">
                {projetos.length > 0 ? `${fmtHoras(projetos[0].totalHoras)} registradas` : ""}
              </div>
            </div>
            <div className="cv-card-icon" style={{ background: "#ff8200" }}>
              <i className="bi bi-trophy-fill" />
            </div>
          </div>
        </div>

        {/* Tabela de projetos — flex: 1 com scroll apenas no corpo */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Cabeçalho fixo */}
          <div style={{ display: "grid", gridTemplateColumns: "400px 1fr 80px 100px 70px", padding: "12px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", flexShrink: 0, gap: 16 }}>
            {["Projeto / Cliente", "", "Horas", "Colaboradores", "% do total"].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i > 1 ? "right" : "left" }}>
                {h}
              </span>
            ))}
          </div>
          {/* Corpo com scroll */}
          <div style={{ flex: 1, overflowY: "auto" }}>
          {projetos.map((p, idx) => {
            const selecionado = projetoSelecionado === p.nome;
            const pctTotal = totalGeralHoras > 0 ? Math.round((p.totalHoras / totalGeralHoras) * 100) : 0;
            const pctBarra = Math.round((p.totalHoras / maxHoras) * 100);
            const cor = PCOLS[idx % PCOLS.length];

            return (
              <div
                key={p.nome}
                onClick={() => setProjetoSelecionado(selecionado ? null : p.nome)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "400px 1fr 80px 100px 70px",
                  padding: "10px 20px",
                  borderBottom: "1px solid #f8fafc",
                  cursor: "pointer",
                  alignItems: "center",
                  gap: 16,
                  background: selecionado ? "#eff6ff" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!selecionado) (e.currentTarget as HTMLDivElement).style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (!selecionado) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Nome — primeira coluna */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: cor, flexShrink: 0 }} />
                  <span 
                    style={{
                      fontSize: 13, fontWeight: selecionado ? 700 : 500,
                      color: selecionado ? "#2563eb" : "#334155",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                    title={p.nome}
                  >
                    {p.nome}
                  </span>
                </div>

                {/* Barra — usa todo espaço restante */}
                <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: 5, borderRadius: 3, width: `${pctBarra}%`, background: cor, transition: "width 0.3s" }} />
                </div>

                {/* Horas — alinhado à direita */}
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: cor }}>{fmtHoras(p.totalHoras)}</span>
                </div>

                {/* Colaboradores — alinhado à direita */}
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{p.colaboradores.length}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{p.colaboradores.length === 1 ? "pessoa" : "pessoas"}</span>
                </div>

                {/* % do total — alinhado à direita */}
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: pctTotal >= 10 ? "#334155" : "#94a3b8" }}>{pctTotal}%</span>
                </div>
              </div>
            );
          })}
          </div>{/* fim do corpo com scroll */}
        </div>{/* fim da tabela */}
      </div>

      {/* Painel de detalhes */}
      <div style={{ width: 360, flexShrink: 0, background: "#fff", borderLeft: "1px solid #f1f5f9", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!proj ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-folder2-open" style={{ fontSize: 24, color: "#6366f1" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#334155" }}>Selecione um projeto</p>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              Clique em qualquer projeto da lista para ver a distribuição por colaborador.
            </p>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Projeto selecionado</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginTop: 4, lineHeight: 1.3 }} title={proj.nome}>
                {proj.nome}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Total de horas</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{fmtHoras(proj.totalHoras)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Colaboradores</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#334155" }}>{proj.colaboradores.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>% do total</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#334155" }}>
                    {totalGeralHoras > 0 ? Math.round((proj.totalHoras / totalGeralHoras) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Distribuição por colaborador
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {colabsOrdenados.map((c, idx) => {
                  const pctColab = Math.round((c.horas / proj.totalHoras) * 100);
                  const pctBarra = Math.round((c.horas / maxColabHoras) * 100);
                  const colab = dados.colaboradores.find((x) => x.nome === c.nome);
                  const expandido = colaboradorExpandido === c.nome;
                  
                  // Busca os projetos do colaborador para este projeto específico
                  const projetoDoColab = colab?.topProjetos.find((p) => p.nome === proj.nome);
                  
                  return (
                    <div key={c.nome}>
                      <button
                        onClick={() => setColaboradorExpandido(expandido ? null : c.nome)}
                        style={{ 
                          width: "100%",
                          padding: "12px 14px", 
                          background: expandido ? "#eff6ff" : "#f8fafc", 
                          borderRadius: 12, 
                          border: expandido ? "1px solid #bfdbfe" : "1px solid #f1f5f9",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "left"
                        }}
                        onMouseEnter={(e) => {
                          if (!expandido) {
                            e.currentTarget.style.background = "#f1f5f9";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!expandido) {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.borderColor = "#f1f5f9";
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="cv-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
                              {iniciais(c.nome)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: expandido ? "#2563eb" : "#334155" }}>{c.nome}</div>
                              {colab && <div style={{ fontSize: 11, color: "#94a3b8" }}>Meta: {colab.meta}h/sem</div>}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: PCOLS[idx % PCOLS.length] }}>{fmtHoras(c.horas)}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{pctColab}% do projeto</div>
                            </div>
                            <i 
                              className={`bi bi-chevron-${expandido ? "up" : "down"}`} 
                              style={{ fontSize: 12, color: "#94a3b8" }}
                            />
                          </div>
                        </div>
                        <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: 5, borderRadius: 3, width: `${pctBarra}%`, background: PCOLS[idx % PCOLS.length] }} />
                        </div>
                      </button>
                      
                      {/* Atividades expandidas */}
                      {expandido && projetoDoColab && projetoDoColab.top3.length > 0 && (
                        <div style={{ 
                          marginTop: 8, 
                          marginLeft: 12,
                          padding: "12px", 
                          background: "#fff", 
                          borderRadius: 8,
                          border: "1px solid #e2e8f0"
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                            Top 3 atividades
                          </div>
                          {projetoDoColab.top3.map((ativ, i) => (
                            <div 
                              key={i} 
                              style={{ 
                                padding: "8px 0", 
                                borderBottom: i < projetoDoColab.top3.length - 1 ? "1px solid #f1f5f9" : "none"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 500, marginBottom: 4 }}>
                                    {ativ.desc}
                                  </div>
                                  {ativ.tarefa && (
                                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                      <i className="bi bi-check2-square" />
                                      <span>{ativ.tarefa}</span>
                                    </div>
                                  )}
                                  {ativ.tags && ativ.tags.length > 0 && (
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                      {ativ.tags.map((tag, tagIdx) => (
                                        <span 
                                          key={tagIdx}
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
                                <div style={{ fontSize: 13, fontWeight: 700, color: PCOLS[idx % PCOLS.length], flexShrink: 0 }}>
                                  {fmtHoras(ativ.horas)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
