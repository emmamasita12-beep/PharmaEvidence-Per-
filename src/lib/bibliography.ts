import { EnvHttpProxyAgent, fetch as proxyFetch } from 'undici';
import type { SearchRecord, Source } from './domain';

const strip = (v: unknown): string => typeof v === 'string' ? v.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
const DOI = /^10\.\d{4,9}\/\S+$/i;
export function normalizeDoi(value: unknown): string | null {
  const s = strip(value).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
  return DOI.test(s) ? s : null;
}
export function parseCrossref(data: unknown, consultedAt: string): Source[] {
  const items = (data as { message?: { items?: Record<string, unknown>[] } })?.message?.items;
  if (!Array.isArray(items)) throw new Error('Crossref devolvió una respuesta no reconocida.');
  return items.slice(0, 10).map(item => {
    const doi = normalizeDoi(item.DOI);
    const date = (item.published ?? item['published-print'] ?? item['published-online']) as {'date-parts'?: number[][]} | undefined;
    const authors = Array.isArray(item.author) ? item.author.map(a => { const r = a as Record<string, string>; return strip([r.family, r.given].filter(Boolean).join(' ')) || strip(r.name); }).filter(Boolean) : [];
    const relation = item.relation as Record<string, unknown> | undefined;
    return { id: `crossref:${doi ?? strip(item.URL)}`, provider: 'Crossref' as const, title: strip((item.title as string[])?.[0]) || '[Título no disponible]', authors, year: String(date?.['date-parts']?.[0]?.[0] ?? ''), journal: strip((item['container-title'] as string[])?.[0]), doi, url: doi ? `https://doi.org/${encodeURI(doi)}` : 'https://search.crossref.org/', abstract: null, status: item['update-to'] || relation?.['is-update-of'] ? 'Contiene relaciones de actualización: revisar el registro editorial; no implica necesariamente retractación.' : 'Retractación o corrección no comprobada; ausencia de alerta no garantiza integridad.', consultedAt, verification: 'Metadatos recuperados de Crossref. No acredita pertinencia ni revisión del texto completo.' };
  });
}
export function parsePubmed(data: unknown, consultedAt: string): Source[] {
  const result = (data as {result?: Record<string, unknown>})?.result;
  if (!result || !Array.isArray(result.uids)) throw new Error('PubMed devolvió una respuesta no reconocida.');
  return (result.uids as string[]).slice(0, 10).map(id => {
    const item = result[id] as Record<string, unknown>;
    if (!item) throw new Error('Registro PubMed incompleto.');
    const ids = Array.isArray(item.articleids) ? item.articleids as {idtype: string; value: string}[] : [];
    const doi = normalizeDoi(ids.find(i => i.idtype === 'doi')?.value);
    const types = Array.isArray(item.pubtype) ? item.pubtype as string[] : [];
    const alerts = types.filter(t => /retract|erratum|correct|expression of concern/i.test(t));
    return { id: `pubmed:${id}`, provider: 'PubMed' as const, title: strip(item.title) || '[Título no disponible]', authors: Array.isArray(item.authors) ? item.authors.map(a => strip((a as {name: string}).name)).filter(Boolean) : [], year: strip(item.pubdate).match(/\b\d{4}\b/)?.[0] ?? '', journal: strip(item.fulljournalname) || strip(item.source), doi, url: `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(id)}/`, abstract: null, status: alerts.length ? `Alerta de tipo de publicación en PubMed: ${alerts.join(', ')}. Revisar aviso editorial.` : 'Sin alerta identificada en los tipos de publicación consultados; estado editorial no comprobado exhaustivamente.', consultedAt, verification: 'Metadatos recuperados de PubMed ESummary. No se ha leído resumen ni texto completo.' };
  });
}

const proxyAgent = process.env.HTTPS_PROXY || process.env.HTTP_PROXY ? new EnvHttpProxyAgent() : undefined;
const serverFetch: typeof fetch = proxyAgent ? ((url, options) => proxyFetch(url as string, { ...options, dispatcher: proxyAgent } as Parameters<typeof proxyFetch>[1]) as unknown as ReturnType<typeof fetch>) : fetch;
type Fetcher = typeof fetch;
async function json(url: URL, fetcher: Fetcher) {
  const response = await fetcher(url, { headers: { Accept: 'application/json', 'User-Agent': 'PharmaAcademic-MVP/0.1' }, signal: AbortSignal.timeout(12000), cache: 'no-store' });
  if (!response.ok) throw new Error(`El proveedor respondió HTTP ${response.status}.`);
  const data = await response.json();
  if (data.error) throw new Error('El proveedor informó un error de consulta.');
  return data;
}
export async function searchBibliography(provider: 'PubMed' | 'Crossref', query: string, year?: number, fetcher: Fetcher = serverFetch): Promise<SearchRecord> {
  const consultedAt = new Date().toISOString();
  let sources: Source[];
  if (provider === 'Crossref') {
    const url = new URL('https://api.crossref.org/works');
    const doi = normalizeDoi(query);
    url.searchParams.set(doi ? 'filter' : 'query.bibliographic', doi ? `doi:${doi}` : query);
    if (year) url.searchParams.set('filter', `${doi ? `doi:${doi},` : ''}from-pub-date:${year}-01-01`);
    url.searchParams.set('rows', '10');
    sources = parseCrossref(await json(url, fetcher), consultedAt);
  } else {
    const url = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
    url.searchParams.set('db', 'pubmed'); url.searchParams.set('retmode', 'json'); url.searchParams.set('retmax', '10');
    url.searchParams.set('term', query);
    if (year) { url.searchParams.set('datetype', 'pdat'); url.searchParams.set('mindate', String(year)); url.searchParams.set('maxdate', String(new Date().getUTCFullYear() + 1)); }
    const search = await json(url, fetcher);
    if (!Array.isArray(search.esearchresult?.idlist)) throw new Error('PubMed devolvió una búsqueda no reconocida.');
    const ids = search.esearchresult.idlist as string[];
    if (!ids.length) sources = [];
    else {
      // NCBI: sin clave, como máximo 3 peticiones por segundo por instancia.
      await new Promise(r => setTimeout(r, 360));
      const summary = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
      summary.searchParams.set('db', 'pubmed'); summary.searchParams.set('retmode', 'json'); summary.searchParams.set('id', ids.join(','));
      sources = parsePubmed(await json(summary, fetcher), consultedAt);
    }
  }
  return { query, provider, consultedAt, filter: year ? `Publicación desde ${year}; máximo 10 registros` : 'Sin filtro de año; máximo 10 registros', sources, warnings: ['Búsqueda exploratoria, no revisión sistemática. Un registro recuperado no respalda automáticamente ninguna afirmación.', 'Vancouver básico: verificar manualmente volumen, número, páginas y autoría antes de entregar.'] };
}
