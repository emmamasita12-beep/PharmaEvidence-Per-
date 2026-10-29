import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchBibliography } from '@/lib/bibliography';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const schema = z.object({ provider: z.enum(['PubMed', 'Crossref']), query: z.string().trim().min(2).max(300), year: z.coerce.number().int().min(1900).max(new Date().getUTCFullYear() + 1).optional() });
let busy = false;
let lastRequest = 0;
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  if (!params.year) delete params.year;
  const parsed = schema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: 'Consulta inválida. Usa 2–300 caracteres y un año válido.' }, { status: 400 });
  if (busy || Date.now() - lastRequest < 1100) return NextResponse.json({ error: 'Espera un momento y vuelve a consultar; protegemos los límites del proveedor.' }, { status: 429, headers: { 'Retry-After': '2' } });
  busy = true; lastRequest = Date.now();
  try {
    const { provider, query, year } = parsed.data;
    return NextResponse.json(await searchBibliography(provider, query, year), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'No fue posible consultar el proveedor. Puede haber una restricción de red, un límite de solicitudes o una interrupción. No se generaron fuentes de reemplazo.' }, { status: 502 });
  } finally { busy = false; lastRequest = Date.now(); }
}
