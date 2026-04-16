"use client";

// Context global que mantém os dados do Clockify em memória
// Evita rebuscar ao navegar entre rotas

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { DadosDashboard } from "@/lib/types";

interface DadosContextType {
  dados: DadosDashboard | null;
  carregando: boolean;
  atualizando: boolean;
  erro: string | null;
  atualizar: (forcar?: boolean) => Promise<void>;
}

const DadosContext = createContext<DadosContextType | null>(null);

export function DadosProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = useCallback(async (forcar = false) => {
    try {
      if (forcar) setAtualizando(true);
      setErro(null);
      const url = forcar ? "/api/dashboard?force=true" : "/api/dashboard";
      const res = await fetch(url);

      // Não autenticado — redireciona para login
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
  }, []);

  useEffect(() => {
    atualizar(false);
  }, [atualizar]);

  return (
    <DadosContext.Provider value={{ dados, carregando, atualizando, erro, atualizar }}>
      {children}
    </DadosContext.Provider>
  );
}

export function useDados(): DadosContextType {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error("useDados deve ser usado dentro de DadosProvider");
  return ctx;
}
