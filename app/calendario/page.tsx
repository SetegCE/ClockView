"use client";

// Página /calendario — Calendário mensal com registros de horas

import { useState } from "react";
import { useDados } from "@/app/context/DadosContext";
import { Loading, Erro } from "@/app/components/LoadingErro";
import { PCOLS } from "@/app/lib/constants";
import { fmt, fmtDataLonga, iniciais } from "@/app/lib/utils";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

export default function PageCalendario() {
  const { dados, carregando, erro } = useDados();

  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  if (carregando) return <Loading />;
  if (erro) return <Erro mensagem={erro} />;
  if (!dados) return null;

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1); } else setMes(mes - 1);
  }
  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(ano + 1); } else setMes(mes + 1);
  }

  function diaTemDado(dataStr: string): boolean {
    const data = new Date(dataStr + "T12:00:00Z");
    return dados.colaboradores.some((c) =>
      c.semanas.some((sd) => {
        if (sd.skip || sd.horas === 0) return false;
        const inicio = new Date(sd.semana + "T00:00:00Z");
        const fim = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
        return data >= inicio && data < fim;
      })
    );
  }

  function colaboradoresDoDia(dataStr: string) {
    const data = new Date(dataStr + "T12:00:00Z");
    const resultado: { nome: string; horas: number; semana: string }[] = [];
    for (const c of dados.colaboradores) {
      for (const sd of c.semanas) {
        if (sd.skip || sd.horas === 0) continue;
        const inicio = new Date(sd.semana + "T00:00:00Z");
        const fim = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (data >= inicio && data < fim) {
          resultado.push({ nome: c.nome, horas: sd.horas, semana: sd.semana });
          break;
        }
      }
    }
    return resultado.sort((a, b) => b.horas - a.horas);
  }

  function semanaDodia(dataStr: string): string | null {
    const data = new Date(dataStr + "T12:00:00Z");
    for (const c of dados.colaboradores) {
      for (const sd of c.semanas) {
        if (sd.skip) continue;
        const inicio = new Date(sd.semana + "T00:00:00Z");
        const fim = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (data >= inicio && data < fim) return sd.semana;
      }
    }
    return null;
  }

  // Monta grade do calendário
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const offsetSeg = (primeiroDia + 6) % 7;
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  const totalCelulas = Math.ceil((offsetSeg + diasNoMes) / 7) * 7;

  const celulas: { dia: number; mesAtual: boolean; dataStr: string }[] = [];
  for (let i = 0; i < totalCelulas; i++) {
    if (i < offsetSeg) {
      const dia = diasMesAnterior - offsetSeg + i + 1;
      const m = mes === 0 ? 12 : mes;
      const a = mes === 0 ? ano - 1 : ano;
      celulas.push({ dia, mesAtual: false, dataStr: `${a}-${String(m).padStart(2,"0")}-${String(dia).padStart(2,"0")}` });
    } else if (i < offsetSeg + diasNoMes) {
      const dia = i - offsetSeg + 1;
      celulas.push({ dia, mesAtual: true, dataStr: `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}` });
    } else {
      const dia = i - offsetSeg - diasNoMes + 1;
      const m = mes === 11 ? 1 : mes + 2;
      const a = mes === 11 ? ano + 1 : ano;
      celulas.push({ dia, mesAtual: false, dataStr: `${a}-${String(m).padStart(2,"0")}-${String(dia).padStart(2,"0")}` });
    }
  }

  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
  const colabsDia = diaSelecionado ? colaboradoresDoDia(diaSelecionado) : [];
  const semanaAtiva = diaSelecionado ? semanaDodia(diaSelecionado) : null;
  const totalHorasSemana = colabsDia.reduce((s, c) => s + c.horas, 0);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Calendário — altura fixa, não rola */}
      <div style={{ flex: 1, overflow: "hidden", padding: 20, display: "flex", flexDirection: "column" }}>
        <div className="cv-cal-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="cv-cal-header">
            <span className="cv-cal-title">{MESES[mes]} {ano}</span>
            <div className="cv-cal-nav">
              <button className="cv-cal-nav-btn" onClick={mesAnterior}><i className="bi bi-chevron-left" /></button>
              <button className="cv-cal-nav-btn" onClick={proximoMes}><i className="bi bi-chevron-right" /></button>
            </div>
          </div>
          <div className="cv-cal-grid" style={{ flex: 1, overflow: "hidden" }}>
            {DIAS_SEMANA.map((d) => <div key={d} className="cv-cal-dow">{d}</div>)}
            {celulas.map((cel) => {
              const temDado = diaTemDado(cel.dataStr);
              const ehHoje = cel.dataStr === hojeStr;
              const selecionado = diaSelecionado === cel.dataStr;
              let classes = "cv-cal-day";
              if (!cel.mesAtual) classes += " other-month";
              if (temDado) classes += " has-data";
              if (ehHoje) classes += " today";
              if (selecionado) classes += " selected";
              return (
                <div key={cel.dataStr} className={classes} onClick={() => setDiaSelecionado(selecionado ? null : cel.dataStr)}>
                  <span className="cv-cal-day-num">{cel.dia}</span>
                  {temDado && <div className="cv-cal-dot" />}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Dias com registros</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e0e7ff", border: "2px solid #6366f1" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Hoje</span>
            </div>
            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>Clique em um dia para ver detalhes</span>
          </div>
        </div>
      </div>

      {/* Painel de detalhes */}
      <div style={{ width: 360, flexShrink: 0, background: "#fff", borderLeft: "1px solid #f1f5f9", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!diaSelecionado ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-calendar3" style={{ fontSize: 24, color: "#6366f1" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#334155" }}>Selecione um dia</p>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              Clique em qualquer dia do calendário para ver os registros de horas da semana correspondente.
            </p>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {semanaAtiva ? `Semana de ${fmtDataLonga(semanaAtiva)}` : fmtDataLonga(diaSelecionado)}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>
                {colabsDia.length} colaborador{colabsDia.length !== 1 ? "es" : ""}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Total de horas</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>{fmt(totalHorasSemana)}h</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Média por pessoa</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#334155" }}>
                    {colabsDia.length > 0 ? fmt(totalHorasSemana / colabsDia.length) : "0.0"}h
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {colabsDia.length === 0 ? (
                <p className="cv-empty">Nenhum registro para esta semana.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {colabsDia.map((c, idx) => {
                    const colab = dados.colaboradores.find((x) => x.nome === c.nome);
                    const pct = colab ? Math.round((c.horas / colab.meta) * 100) : 0;
                    const cor = pct >= 95 ? "#042C53" : pct >= 75 ? "#185FA5" : pct >= 50 ? "#EF9F27" : "#E24B4A";
                    return (
                      <div key={c.nome} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="cv-avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>{iniciais(c.nome)}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{c.nome}</div>
                              {colab && <div style={{ fontSize: 10, color: "#94a3b8" }}>Meta: {colab.meta}h/sem</div>}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: cor }}>{fmt(c.horas)}h</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: cor }}>{pct}%</div>
                          </div>
                        </div>
                        <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: 4, borderRadius: 2, width: `${Math.min(pct, 100)}%`, background: cor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
