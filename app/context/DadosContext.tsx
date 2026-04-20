"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { START_DATE } from "@/config/clockify";
import type { DadosDashboard } from "@/lib/types";

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  const [periodoInicio, setPeriodoInicio] = useState(START_DATE);
  const [periodoFim, setPeriodoFim] = useState(hoje);
  const pathname = usePathname();

  const atualizar = useCallback(async (forcar = false) => {
    try {
      if (forcar) {
        setAtualizando(true);
        console.log('[CONTEXT] Forçando atualização - limpando estado anterior');
      }
      setErro(null);
      
      const params = new URLSearchParams({ inicio: periodoInicio, fim: periodoFim });
      if (forcar) params.set("force", "true");
      
      // Adiciona timestamp único para FORÇAR o navegador a não usar cache
      params.set("_t", Date.now().toString());
      
      console.log(`[CONTEXT] Buscando dados - force: ${forcar}, período: ${periodoInicio} a ${periodoFim}`);
      console.log(`[CONTEXT] URL: /api/dashboard?${params.toString()}`);
      
      const res = await fetch(`/api/dashboard?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store', // NUNCA usa cache do navegador
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log(`[CONTEXT] Resposta recebida - status: ${res.status}, ok: ${res.ok}`);

      if (res.status === 401) {
        console.log('[CONTEXT] Não autorizado, redirecionando para login');
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorMsg = body.error ?? `Erro HTTP ${res.status}`;
        console.error('[CONTEXT] Erro na resposta:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const json: DadosDashboard = await res.json();
      console.log(`[CONTEXT] Dados parseados com sucesso - ${json.colaboradores.length} colaboradores`);
      console.log(`[CONTEXT] Timestamp dos dados: ${json.atualizadoEm}`);
      
      setDados(json);
      console.log('[CONTEXT] Estado atualizado com sucesso');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Erro desconhecido";
      console.error('[CONTEXT] ERRO ao atualizar:', errorMsg, e);
      setErro(errorMsg);
    } finally {
      setCarregando(false);
      setAtualizando(false);
      console.log('[CONTEXT] Atualização finalizada');
    }
  }, [periodoInicio, periodoFim]);

  useEffect(() => {
    if (pathname === "/login") {
      setCarregando(false);
      return;
    }
    atualizar(false);
  }, [atualizar, pathname]);

  // Atualiza automaticamente quando o período muda
  useEffect(() => {
    if (pathname === "/login") return;
    if (carregando) return; // Não atualiza durante o carregamento inicial
    
    console.log('[CONTEXT] Período alterado, atualizando dados...');
    atualizar(true); // Força atualização para ignorar cache
  }, [periodoInicio, periodoFim, pathname, carregando, atualizar]);

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
