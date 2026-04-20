// Endpoint de debug para verificar dados do Henrique
import { NextResponse } from "next/server";
import { fetchFromClockifyLong } from "@/services/clockifyClient";

const CLOCKIFY_API_TOKEN = process.env.CLOCKIFY_API_TOKEN;
const CLOCKIFY_WORKSPACE_ID = process.env.CLOCKIFY_WORKSPACE_ID;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Busca usuários
    const resUsuarios = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=ACTIVE&page=1&page-size=200`,
      { headers: { "X-Api-Key": CLOCKIFY_API_TOKEN! } }
    );
    const usuarios = await resUsuarios.json();

    // Encontra Henrique
    const henrique = usuarios.find((u: any) => 
      u.name.toLowerCase().includes("henrique") && u.name.toLowerCase().includes("lima")
    );

    if (!henrique) {
      return NextResponse.json({ error: "Henrique não encontrado" }, { status: 404 });
    }

    // Busca entradas do Henrique
    const hoje = new Date().toISOString().slice(0, 10);
    const startISO = "2026-04-01T00:00:00Z";
    const endISO = `${hoje}T23:59:59Z`;

    const resEntradas = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${CLOCKIFY_WORKSPACE_ID}/user/${henrique.id}/time-entries?start=${startISO}&end=${endISO}&page=1&page-size=500`,
      { headers: { "X-Api-Key": CLOCKIFY_API_TOKEN! } }
    );
    const entradas = await resEntradas.json();

    // Filtra entradas de hoje
    const entradasHoje = entradas.filter((e: any) => 
      e.timeInterval?.start?.startsWith(hoje)
    );

    // Busca projetos
    const resProjetos = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${CLOCKIFY_WORKSPACE_ID}/projects?archived=false&page=1&page-size=500`,
      { headers: { "X-Api-Key": CLOCKIFY_API_TOKEN! } }
    );
    const projetos = await resProjetos.json();
    const mapaProjetos = new Map(projetos.map((p: any) => [p.id, `${p.name} - ${p.clientName || 'Sem cliente'}`]));

    return NextResponse.json({
      usuario: {
        nome: henrique.name,
        email: henrique.email,
        id: henrique.id,
        status: henrique.status
      },
      periodo: {
        inicio: startISO,
        fim: endISO,
        hoje
      },
      estatisticas: {
        totalEntradas: entradas.length,
        entradasHoje: entradasHoje.length
      },
      entradasDeHoje: entradasHoje.map((e: any) => ({
        id: e.id,
        inicio: e.timeInterval?.start,
        fim: e.timeInterval?.end,
        duracao: e.timeInterval?.duration,
        descricao: e.description,
        projeto: mapaProjetos.get(e.projectId) || "Sem projeto",
        projectId: e.projectId,
        billable: e.billable
      })),
      ultimasEntradas: entradas.slice(0, 10).map((e: any) => ({
        data: e.timeInterval?.start?.slice(0, 10),
        hora: e.timeInterval?.start?.slice(11, 19),
        duracao: e.timeInterval?.duration,
        descricao: e.description?.substring(0, 80),
        projeto: mapaProjetos.get(e.projectId) || "Sem projeto"
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }, { status: 500 });
  }
}
