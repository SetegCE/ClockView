"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { DadosDashboard } from "@/lib/types";

function primeiroDiaDoMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function ultimoDiaDoMes(): string {
  const d = new Date();
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${ultimoDia.getFullYear()}-${String(ultimoDia.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia.getDate()).padStart(2, "0")}`;
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
  const [periodoInicio, setPeriodoInicio] = useState(primeiroDiaDoMes());
  const [periodoFim, setPeriodoFim] = useState(ultimoDiaDoMes());
  const pathname = usePathname();

  // Controla se é o primeiro render (não dispara busca ao mudar período no mount)
  const montado = useRef(false);

  async function buscar(inicio: string, fim: string, forcar: boolean) {
    try {
      if (forcar) setAtualizando(true);
      setErro(null);

      const params = new URLSearchParams({ inicio, fim });
      if (forcar) params.set("force", "true");

      console.log(`[CONTEXT] Buscando: ${inicio} a ${fim}, force=${forcar}`);

      const res = await fetch(`/api/dashboard?${params.toString()}`, {
        cache: "no-store",
      });

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
      console.log(`[CONTEXT] OK - ${json.colaboradores.length} colaboradores`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  // Carregamento inicial — uma única vez
  useEffect(() => {
    if (pathname === "/login") {
      setCarregando(false);
      return;
    }
    buscar(periodoInicio, periodoFim, false);
    montado.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Quando período muda — ignora o mount inicial
  useEffect(() => {
    if (!montado.current) return;
    if (pathname === "/login") return;
    buscar(periodoInicio, periodoFim, true);
  }, [periodoInicio, periodoFim]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualização automática a cada 1 hora
  useEffect(() => {
    if (pathname === "/login") return;
    const intervalo = setInterval(() => {
      console.log("[AUTO-UPDATE] 1h");
      buscar(periodoInicio, periodoFim, true);
    }, 3600000);
    return () => clearInterval(intervalo);
  }, [periodoInicio, periodoFim, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  async function atualizar(forcar = false) {
    await buscar(periodoInicio, periodoFim, forcar);
  }

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
