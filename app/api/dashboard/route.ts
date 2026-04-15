// Route Handler: GET /api/dashboard
// Retorna dados do cache ou processa novos dados do Clockify

import { NextRequest, NextResponse } from "next/server";
import { processarDashboard, invalidarCache } from "@/services/dashboardService";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // ?force=true invalida o cache e força nova busca
  const force = request.nextUrl.searchParams.get("force") === "true";
  if (force) invalidarCache();

  try {
    const dados = await processarDashboard();
    return NextResponse.json(dados);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
