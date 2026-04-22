"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
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

  // Ref para acessar período atual sem recriar atualizar a cada mudança
  const periodoRef = useRef({ inicio: periodoInicio, fim: periodoFim });
  periodoRef.current = { inicio: periodoInicio, fim: periodoFim };

  // Ref para evitar requisição duplicada em andamento
  const requisicaoEmAndamento = useRef(false);

  const atualizar = useCallback(async (forcar = false) => {
    // Evita requisições simultâneas
    if (requisicaoEmAndamento.current) {
      console.log('[CONTEXT] Requisição já em andamento, ignorando');
      return;
    }

    requisicaoEmAndamento.current = true;

    try {
      if (forcar) setAtualizando(true);
      setErro(null);

      const { inicio, fim } = periodoRef.current;
      const params = new URLSearchParams({ inicio, fim });
      if (forcar) params.set("force", "true");

      console.log(`[CONTEXT] Buscando dados - force: ${forcar}, período: ${inicio} a ${fim}`);

      const res = await fetch(`/api/dashboard?${params.toString()}`, {
        cache: 'no-store',
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
      console.log(`[CONTEXT] Dados atualizados - ${json.colaboradores.length} colaboradores`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
      setAtualizando(false);
      requisicaoEmAndamento.current = false;
    }
  }, []); // sem dependências — usa periodoRef para acessar período atual

  // Carrega dados UMA única vez ao montar (não ao trocar de página)
  const carregouInicial = useRef(false);
  useEffect(() => {
    if (pathname === "/login") {
      setCarregando(false);
      return;
    }
    if (carregouInicial.current) return;
    carregouInicial.current = true;
    atualizar(false);
  }, [pathname, atualizar]);

  // Atualiza APENAS quando o período muda explicitamente pelo usuário
  const periodoInicializado = useRef(false);
  useEffect(() => {
    if (!periodoInicializado.current) {
      periodoInicializado.current = true;
      return; // ignora o mount inicial
    }
    if (pathname === "/login") return;
    console.log('[CONTEXT] Período alterado, atualizando...');
    atualizar(true);
  }, [periodoInicio, periodoFim]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualização automática a cada 1 hora
  useEffect(() => {
    if (pathname === "/login") return;
    const intervalo = setInterval(() => {
      console.log('[AUTO-UPDATE] Atualização automática (1h)');
      atualizar(true);
    }, 3600000);
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
