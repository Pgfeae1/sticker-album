import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Health check endpoint para monitoramento (Uptime Robot, Vercel, etc.).
 * Retorna 200 se o servidor está de pé.
 *
 * Pode ser expandido para testar a conexão com o Supabase se necessário.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
    },
    { status: 200 },
  );
}
