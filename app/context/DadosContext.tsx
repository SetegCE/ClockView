"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { DadosDashboard } from "@/lib/types";

function primeiroDiaMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function ultimoDiaMes(): string {
  const d = new Date();
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, "0")}-${String(ultimo.getDate()).padStart(2, "0")}`;
}

interface DadosContextType {
  dados: DadosDashboard | null;
  carregando: boolean;
  atualizando: boolean;
  erro: string | null;
  periodoInicio: string;
  periodoFim: string;
  setPeriodoInicio: (d: string) => void;
  setPeriodoFim: (d: string) => void;
  atualizar: (forcar?: boolean) => Promise<void>;
}

const DadosContext = createContext<DadosContextType | null>(null);

export function DadosProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [periodoInicio, setPeriodoInicio] = useState(primeiroDiaMes);
  const [periodoFim, setPeriodoFim] = useState(ultimoDiaMes);
  const pathname = usePathname();

  const atualizar = useCallback(async (forcar = false) => {
    try {
      if (forcar) setAtualizando(true);
      setErro(null);
      const params = new URLSearchParams({ inicio: periodoInicio, fim: periodoFim });
      if (forcar) params.set("force", "true");
      const res = await fetch(`/api/dashboard?${params.toString()}`);

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erro HTTP ${res.status}`);
      }
      const json: DadosDashboard = await res.json();
      setDados(json);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [periodoInicio, periodoFim]);

  useEffect(() => {
    if (pathname === "/login") {
      setCarregando(false);
      return;
    }
    atualizar(false);
  }, [atualizar, pathname]);

  // Atualização automática a cada hora
  useEffect(() => {
    if (pathname === "/login") return;

    // Configura intervalo de 1 hora (3600000 ms)
    const intervalo = setInterval(() => {
      console.log('[AUTO-UPDATE] Atualizando dados automaticamente...');
      atualizar(true); // Força atualização para ignorar cache
    }, 3600000); // 1 hora

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalo);
  }, [atualizar, pathname]);

  return (
    <DadosContext.Provider value={{
      dados, carregando, atualizando, erro,
      periodoInicio, periodoFim, setPeriodoInicio, setPeriodoFim,
      atualizar,
    }}>
      {children}
    </DadosContext.Provider>
  );
}

export function useDados(): DadosContextType {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error("useDados deve ser usado dentro de DadosProvider");
  return ctx;
}
