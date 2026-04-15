"use client";

// Componentes de estado de carregamento e erro reutilizáveis

export function Loading() {
  return (
    <div className="cv-loading">
      <div className="cv-spinner" />
      <div>
        <div className="cv-loading-title">Carregando dados…</div>
        <div className="cv-loading-sub">Buscando registros do Clockify</div>
      </div>
    </div>
  );
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <div className="cv-error">
      <i className="bi bi-exclamation-triangle-fill" />
      <div>
        <strong>Erro ao carregar dados</strong>
        <div style={{ marginTop: 4, fontSize: 13 }}>{mensagem}</div>
      </div>
    </div>
  );
}
