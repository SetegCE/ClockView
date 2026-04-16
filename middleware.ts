// Middleware do Next.js — protege todas as rotas exceto /login e /api/auth

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — não precisam de autenticação
  const rotasPublicas = ["/login", "/api/auth/login"];
  if (rotasPublicas.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Verifica o cookie de sessão
  const sessao = request.cookies.get("clockview_session");
  if (!sessao || sessao.value !== "authenticated") {
    // Se for uma rota de API, retorna 401 em JSON em vez de redirecionar
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    // Para páginas, redireciona para o login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-seteg.png).*)"],
};
