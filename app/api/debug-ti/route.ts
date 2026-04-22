// Endpoint de diagnóstico temporário — investiga usuário TI na API do Clockify
import { NextResponse } from "next/server";

const CLOCKIFY_API_TOKEN = process.env.CLOCKIFY_API_TOKEN;
const CLOCKIFY_WORKSPACE_ID = process.env.CLOCKIFY_WORKSPACE_ID;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const headers = { "X-Api-Key": CLOCKIFY_API_TOKEN! };

    // 1. Busca APENAS ativos (como o dashboard faz)
    const resAtivos = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=ACTIVE&page=1&page-size=200`,
      { headers }
    );
    const usuariosAtivos: any[] = await resAtivos.json();

    // 2. Busca TODOS (ativos + inativos) para comparar
    const resTodos = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?page=1&page-size=200`,
      { headers }
    );
    const todosusuarios: any[] = await resTodos.json();

    // 3. Busca inativos explicitamente
    const resInativos = await fetch(
      `https://api.clockify.me/api/v1/workspaces/${CLOCKIFY_WORKSPACE_ID}/users?status=INACTIVE&page=1&page-size=200`,
      { headers }
    );
    const usuariosInativos: any[] = await resInativos.json();

    // Encontra "TI" em cada lista
    const tiAtivo    = usuariosAtivos.find((u: any) => u.name.toLowerCase().includes("ti") && !u.name.toLowerCase().includes("cristina"));
    const tiTodos    = todosusuarios.find((u: any) => u.name.toLowerCase().includes("ti") && !u.name.toLowerCase().includes("cristina"));
    const tiInativo  = usuariosInativos.find((u: any) => u.name.toLowerCase().includes("ti") && !u.name.toLowerCase().includes("cristina"));

    // 4. Se TI aparece como ativo, busca as entradas dele em abril
    let entradasAbril: any[] = [];
    const usuarioTI = tiAtivo ?? tiTodos;
    if (usuarioTI) {
      const resEntradas = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${CLOCKIFY_WORKSPACE_ID}/user/${usuarioTI.id}/time-entries?start=2026-04-01T00:00:00Z&end=2026-04-30T23:59:59Z&page=1&page-size=500`,
        { headers }
      );
      entradasAbril = await resEntradas.json();
    }

    return NextResponse.json({
      resumo: {
        totalAtivos: usuariosAtivos.length,
        totalTodos: todosusuarios.length,
        totalInativos: usuariosInativos.length,
        tiEncontradoComoAtivo: !!tiAtivo,
        tiEncontradoComoInativo: !!tiInativo,
        tiEncontradoNaListaGeral: !!tiTodos,
      },
      tiNaListaAtivos: tiAtivo ? {
        id: tiAtivo.id,
        nome: tiAtivo.name,
        email: tiAtivo.email,
        status: tiAtivo.status,
      } : null,
      tiNaListaInativos: tiInativo ? {
        id: tiInativo.id,
        nome: tiInativo.name,
        email: tiInativo.email,
        status: tiInativo.status,
      } : null,
      tiNaListaGeral: tiTodos ? {
        id: tiTodos.id,
        nome: tiTodos.name,
        email: tiTodos.email,
        status: tiTodos.status,
      } : null,
      entradasAbril2026: {
        total: entradasAbril.length,
        entradas: entradasAbril.map((e: any) => ({
          data: e.timeInterval?.start?.slice(0, 10),
          duracao: e.timeInterval?.duration,
          descricao: e.description?.substring(0, 60),
          projectId: e.projectId,
        })),
      },
      // Lista todos os ativos para conferência
      todosAtivos: usuariosAtivos.map((u: any) => ({
        nome: u.name,
        status: u.status,
        email: u.email,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }, { status: 500 });
  }
}
