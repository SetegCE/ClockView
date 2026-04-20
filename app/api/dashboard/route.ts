// Route Handler: GET /api/dashboard
// Retorna dados do cache ou processa novos dados do Clockify

import { NextRequest, NextResponse } from "next/server";
import { processarDashboard, invalidarCache } from "@/services/dashboardService";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Retorna o primeiro dia do mês atual no formato YYYY-MM-DD */
function primeiroDiaMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Retorna o último dia do mês atual no formato YYYY-MM-DD */
function ultimoDiaMes(): string {
  const d = new Date();
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, "0")}-${String(ultimo.getDate()).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const force = params.get("force") === "true";
  const inicio = params.get("inicio") ?? primeiroDiaMes();
  const fim = params.get("fim") ?? ultimoDiaMes();

  console.log(`[API] GET /api/dashboard - force: ${force}, período: ${inicio} a ${fim}`);

  if (force) {
    console.log('[API] Invalidando cache...');
    invalidarCache();
  }

  try {
    const dados = await processarDashboard(inicio, fim);
    console.log(`[API] Retornando ${dados.colaboradores.length} colaboradores`);
    return NextResponse.json(dados);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
    console.error('[API] Erro ao processar dashboard:', mensagem);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
