// Route Handler: GET /api/dashboard
// Retorna dados do cache ou processa novos dados do Clockify

import { NextRequest, NextResponse } from "next/server";
import { processarDashboard, invalidarCache } from "@/services/dashboardService";
import { START_DATE } from "@/config/clockify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Retorna a data de hoje no formato YYYY-MM-DD */
function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const force = params.get("force") === "true";
  const inicio = params.get("inicio") ?? START_DATE;
  const fim = params.get("fim") ?? hoje();

  console.log(`[API] GET /api/dashboard - force: ${force}, período: ${inicio} a ${fim}`);
  console.log(`[API] Timestamp da requisição: ${new Date().toISOString()}`);

  if (force) {
    console.log('[API] Force=true, invalidando cache...');
    invalidarCache();
  }

  try {
    const dados = await processarDashboard(inicio, fim, force);
    console.log(`[API] Retornando ${dados.colaboradores.length} colaboradores`);
    console.log(`[API] Timestamp dos dados: ${dados.atualizadoEm}`);
    
    // Headers para FORÇAR o navegador a não cachear
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Content-Type', 'application/json');
    
    return new NextResponse(JSON.stringify(dados), { headers });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
    console.error('[API] Erro ao processar dashboard:', mensagem);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
