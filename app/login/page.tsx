"use client";

// Página de login — código de acesso único

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PageLogin() {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Código inválido");
      }

      // Login bem-sucedido — redireciona para o dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao fazer login");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F8F9FC",
      fontFamily: "'Satoshi', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/logo-seteg.png"
            alt="SETEG"
            style={{ width: 64, height: 64, objectFit: "contain", margin: "0 auto" }}
          />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginTop: 12 }}>
            ClockView
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            Dashboard de jornada semanal — SETEG
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="codigo"
              style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}
            >
              Código de acesso
            </label>
            <input
              id="codigo"
              type="password"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Digite seu código"
              required
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              padding: "10px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: 13,
              color: "#b91c1c",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <i className="bi bi-exclamation-triangle-fill" />
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={carregando || !codigo.trim()}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: carregando ? "not-allowed" : "pointer",
              opacity: carregando || !codigo.trim() ? 0.5 : 1,
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!carregando && codigo.trim()) {
                (e.target as HTMLButtonElement).style.background = "#1d4ed8";
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = "#2563eb";
            }}
          >
            {carregando ? "Verificando..." : "Entrar"}
          </button>
        </form>

        {/* Nota de segurança */}
        <p style={{
          fontSize: 11,
          color: "#94a3b8",
          textAlign: "center",
          marginTop: 20,
          lineHeight: 1.5,
        }}>
          <i className="bi bi-shield-lock-fill" style={{ marginRight: 4 }} />
          Acesso restrito aos colaboradores autorizados da SETEG
        </p>
      </div>
    </div>
  );
}
