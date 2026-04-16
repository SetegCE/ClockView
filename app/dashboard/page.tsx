"use client";

// Página /dashboard — Heatmap de jornada semanal

import { useState } from "react";
import { useDados } from "@/app/context/DadosContext";
import { Loading, Erro } from "@/app/components/LoadingErro";
import PainelDetalhes from "@/app/components/PainelDetalhes";
import { corCelula, badgeClass, fmt, fmtData, trunc, iniciais, numeroSemanaISO } from "@/app/lib/utils";

type TipoOrdem = "mediaPct" | "nome" | "mediaHoras";

export default function PageDashboard() {
  const { dados, carregando, erro } = useDados();

  const [ordem, setOrdem] = useState<TipoOrdem>("mediaPct");
  const [colaboradorAberto, setColaboradorAberto] = useState<string | null>(null);
  const [semanaAberta, setSemanaAberta] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  if (carregando) return <Loading />;
  if (erro) return <Erro mensagem={erro} />;
  if (!dados) return null;

  // Semanas com pelo menos 1 dado real
  const semanasVisiveis = dados.todasSemanas.filter((s) =>
    dados.colaboradores.some((c) => {
      const sd = c.semanas.find((x) => x.semana === s);
      return sd && !sd.skip && sd.horas > 0;
    })
  );

  const lista = dados.colaboradores
    .filter((c) => busca.trim() === "" || c.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => {
      if (ordem === "nome") return a.nome.localeCompare(b.nome);
      if (ordem === "mediaHoras") return b.mediaHoras - a.mediaHoras;
      return b.mediaPct - a.mediaPct;
    });

  const totalColabs = dados.colaboradores.length;
  const mediaGeral = totalColabs > 0
    ? dados.colaboradores.reduce((acc, c) => acc + c.mediaPct, 0) / totalColabs : 0;
  const acimaMeta = dados.colaboradores.filter((c) => c.mediaPct >= 95).length;

  const colaboradorSelecionado = colaboradorAberto
    ? dados.colaboradores.find((c) => c.nome === colaboradorAberto) ?? null
    : null;

  return (
    <div className="cv-content">
      <div className="cv-col">
        <div className="cv-inner">
          {/* Cards */}
          <div className="cv-cards">
            <div className="cv-card">
              <div>
                <div className="cv-card-label">Colaboradores</div>
                <div className="cv-card-value">{totalColabs}</div>
                <div className="cv-card-sub">ativos no período</div>
              </div>
              <div className="cv-card-icon" style={{ background: "#2563eb" }}>
                <i className="bi bi-people-fill" />
              </div>
            </div>
            <div className="cv-card">
              <div>
                <div className="cv-card-label">Média geral</div>
                <div className="cv-card-value">{Math.round(mediaGeral)}%</div>
                <div className="cv-card-sub">da meta semanal</div>
              </div>
              <div className="cv-card-icon" style={{ background: "#2563eb" }}>
                <i className="bi bi-graph-up" />
              </div>
            </div>
            <div className="cv-card">
              <div>
                <div className="cv-card-label">Acima da meta</div>
                <div className="cv-card-value">{acimaMeta}</div>
                <div className="cv-card-sub">colaboradores ≥ 95%</div>
              </div>
              <div className="cv-card-icon" style={{ background: "#2563eb" }}>
                <i className="bi bi-award-fill" />
              </div>
            </div>
            <div className="cv-card">
              <div>
                <div className="cv-card-label">Semanas analisadas</div>
                <div className="cv-card-value">{semanasVisiveis.length}</div>
                <div className="cv-card-sub">com dados registrados</div>
              </div>
              <div className="cv-card-icon" style={{ background: "#2563eb" }}>
                <i className="bi bi-calendar-week-fill" />
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="cv-heatmap-section">
            <div className="cv-toolbar">
              <div className="cv-toolbar-left">
                <span className="cv-toolbar-title">Heatmap de horas</span>
                <div className="cv-legend">
                  {[
                    { bg: "#D3D1C7", label: "Sem dados" },
                    { bg: "#E24B4A", label: "≤ 50%" },
                    { bg: "#EF9F27", label: "≤ 80%" },
                    { bg: "#3B6D11", label: "> 80%" },
                  ].map((l) => (
                    <div key={l.label} className="cv-legend-item">
                      <div className="cv-legend-rect" style={{ background: l.bg }} />
                      <span className="cv-legend-label">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cv-toolbar-right">
                <div className="cv-search-wrap">
                  <i className="bi bi-search cv-search-icon" />
                  <input
                    className="cv-search"
                    placeholder="Buscar colaborador…"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <select
                  className="cv-select"
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as TipoOrdem)}
                >
                  <option value="mediaPct">Ordenar por %</option>
                  <option value="mediaHoras">Ordenar por horas</option>
                  <option value="nome">Ordenar por nome</option>
                </select>
              </div>
            </div>

            <div className="cv-heatmap-scroll">
              <div className="cv-heatmap-inner">
                <div className="cv-week-header">
                  {semanasVisiveis.map((s) => (
                    <div key={s} className="cv-week-label" title={fmtData(s)}>
                      Sem {numeroSemanaISO(s)}
                    </div>
                  ))}
                </div>
                <div className="cv-rows">
                  {lista.map((colab) => {
                    const selecionado = colaboradorAberto === colab.nome;
                    const partes = colab.nome.trim().split(/\s+/);
                    return (
                      <div key={colab.nome} className={`cv-row${selecionado ? " selected" : ""}`}>
                        <button
                          className="cv-row-name"
                          onClick={() => setColaboradorAberto(selecionado ? null : colab.nome)}
                        >
                          <div className="cv-avatar">{iniciais(colab.nome)}</div>
                          <div>
                            <div className="cv-name-first">{partes[0]}</div>
                            {partes.length > 1 && (
                              <div className="cv-name-last">{trunc(partes.slice(1).join(" "), 18)}</div>
                            )}
                          </div>
                        </button>
                        <div className="cv-cells">
                          {semanasVisiveis.map((s) => {
                            const sd = colab.semanas.find((x) => x.semana === s);

                            // Semana antes do início do colaborador — célula invisível
                            if (sd?.skip) return <div key={s} className="cv-cell-empty" />;

                            // Sem dado (semana existe no período mas colaborador não registrou)
                            if (!sd || sd.horas === 0) {
                              return (
                                <div
                                  key={s}
                                  className="cv-cell no-data"
                                  style={{ background: "#D3D1C7", color: "#5F5E5A" }}
                                  title={`${colab.nome} — ${fmtData(s)}: sem registro`}
                                />
                              );
                            }

                            const { bg, fg } = corCelula(sd.horas, colab.meta);
                            const destacado = semanaAberta === s && selecionado;
                            return (
                              <button
                                key={s}
                                className={`cv-cell${sd.carnavalAuto ? " cv-cell-carnav" : ""}${destacado ? " highlighted" : ""}`}
                                style={{ background: bg, color: fg }}
                                title={`${colab.nome} — Sem ${numeroSemanaISO(s)} (${fmtData(s)}): ${fmt(sd.horas)}h (${sd.pct}%)`}
                                onClick={() => {
                                  setColaboradorAberto(colab.nome);
                                  setSemanaAberta(destacado ? null : s);
                                }}
                              >
                                {fmt(sd.horas)}
                              </button>
                            );
                          })}
                        </div>
                        <div className="cv-row-meta">
                          <span className={badgeClass(colab.mediaPct)}>{colab.mediaPct}%</span>
                          <span className="cv-hours">{fmt(colab.mediaHoras)}h / {colab.meta}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {colaboradorSelecionado && (
        <PainelDetalhes
          colaborador={colaboradorSelecionado}
          semana={semanaAberta}
          onFechar={() => { setColaboradorAberto(null); setSemanaAberta(null); }}
        />
      )}
    </div>
  );
}
