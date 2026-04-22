// Cliente HTTP para comunicação com a Clockify API
// Todas as chamadas externas passam por esta camada — o token nunca é exposto ao frontend

import { CLOCKIFY_BASE_URL } from "@/config/clockify";

export type ResultadoClockify<T> =
  | { data: T }
  | { status: number; message: string };

/**
 * Realiza chamada GET à Clockify API com autenticação e timeout de 8 segundos.
 * cache: 'no-store' garante que o Next.js/Vercel nunca faça cache desta chamada.
 */
export async function fetchFromClockify<T>(
  path: string,
  token: string | undefined,
): Promise<ResultadoClockify<T>> {
  if (!token) {
    return { status: 500, message: "Token de autenticação não configurado" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const resposta = await fetch(`${CLOCKIFY_BASE_URL}${path}`, {
      headers: { "X-Api-Key": token },
      cache: "no-store", // impede cache do Next.js/Vercel Data Cache
      signal: controller.signal,
    });

    if (!resposta.ok) {
      return {
        status: resposta.status,
        message: `Erro na Clockify API: ${resposta.status} ${resposta.statusText}`,
      };
    }

    let dados: T;
    try {
      dados = (await resposta.json()) as T;
    } catch {
      return { status: 502, message: "Resposta inválida recebida da API do Clockify" };
    }

    return { data: dados };
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      return { status: 504, message: "Tempo limite de resposta da API do Clockify excedido" };
    }
    throw erro;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Versão com timeout maior (30s) para buscas paginadas de entradas de tempo.
 * cache: 'no-store' garante que o Next.js/Vercel nunca faça cache desta chamada.
 */
export async function fetchFromClockifyLong<T>(
  path: string,
  token: string | undefined,
): Promise<ResultadoClockify<T>> {
  if (!token) {
    return { status: 500, message: "Token de autenticação não configurado" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const resposta = await fetch(`${CLOCKIFY_BASE_URL}${path}`, {
      headers: { "X-Api-Key": token },
      cache: "no-store", // impede cache do Next.js/Vercel Data Cache
      signal: controller.signal,
    });

    if (!resposta.ok) {
      return {
        status: resposta.status,
        message: `Erro na Clockify API: ${resposta.status} ${resposta.statusText}`,
      };
    }

    let dados: T;
    try {
      dados = (await resposta.json()) as T;
    } catch {
      return { status: 502, message: "Resposta inválida recebida da API do Clockify" };
    }

    return { data: dados };
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      return { status: 504, message: "Tempo limite de resposta da API do Clockify excedido" };
    }
    throw erro;
  } finally {
    clearTimeout(timeoutId);
  }
}
