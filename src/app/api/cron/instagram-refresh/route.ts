import { NextResponse, type NextRequest } from 'next/server'
import { refrescarTokenInstagram } from '@/lib/instagram'

// Corre semanal (ver vercel.json) — renueva el token de Instagram antes de
// que venza a los 60 días. Protegido con CRON_SECRET: solo Vercel puede
// llamarlo (manda el Authorization automático cuando la variable existe).
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 })
  }

  const resultado = await refrescarTokenInstagram()
  return NextResponse.json({ ok: true, ...resultado })
}
