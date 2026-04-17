// API Route: POST /api/auth/login
// Valida o código de acesso e cria um cookie de sessão

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { codigo } = await request.json();

  if (!codigo) {
    return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
  }

  // Códigos válidos armazenados como variáveis de ambiente
  const codigosValidos = [
    process.env.ACCESS_CODE_1,
    process.env.ACCESS_CODE_2,
    process.env.ACCESS_CODE_3,
  ].filter(Boolean);

  if (!codigosValidos.includes(codigo)) {
    return NextResponse.json({ error: "Código de acesso inválido" }, { status: 401 });
  }

  // Cria a resposta com cookie de sessão (7 dias)
  const response = NextResponse.json({ ok: true });
  response.cookies.set("clockview_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });

  return response;
}
