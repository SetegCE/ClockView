// API Route: POST /api/auth/logout
// Remove o cookie de sessão

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("clockview_session");
  return response;
}
