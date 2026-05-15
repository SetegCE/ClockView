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

  // montado: true quando a busca inicial já foi disparada
  const montado = useRef(false);
  // periodoJaMudou: permite que Effect 2 ignore o próprio mount inicial
  const periodoJaMudou = useRef(false);

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

  // Busca inicial — reage a mudanças de pathname para cobrir a navegação SPA pós-login.
  // Quando router.push("/dashboard") é chamado após login, o layout não remonta,
  // então um useEffect com deps=[] não reexecutaria. Com deps=[pathname], ele
  // detecta a transição /login → /dashboard e dispara a busca.
  useEffect(() => {
    if (pathname === "/login") {
      setCarregando(false);
      montado.current = false; // reset para suportar re-login na mesma sessão
      return;
    }
    if (!montado.current) {
      montado.current = true;
      buscar(periodoInicio, periodoFim, false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quando período muda — usa ref próprio para ignorar o mount inicial
  // (periodoJaMudou evita a dupla chamada que ocorria com montado compartilhado)
  useEffect(() => {
    if (!periodoJaMudou.current) {
      periodoJaMudou.current = true;
      return;
    }
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
