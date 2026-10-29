import { z } from 'zod';

export const EXAMPLE_TITLE = 'Formulación, caracterización fisicoquímica y evaluación de la actividad antifúngica in vitro de gomitas masticables sin azúcar con extracto estandarizado de kion (Zingiber officinale Roscoe) frente a Candida albicans, Lima, 2027';
export const titleSchema = z.string().trim().min(15, 'Escribe al menos 15 caracteres.').max(1000, 'El título debe tener como máximo 1000 caracteres.');
export type Finding = { area: string; fragment: string; observation: string; action: string; status: 'Tentativo' | 'Requiere información'; severity: 'Nota' | 'Revisar'; basis: string };
export type Evaluation = { version: string; evaluatedAt: string; title: string; words: number; design: string; variables: string[]; findings: Finding[]; questions: string[]; alternatives: {title: string; reason: string}[]; missing: string[] };

export function evaluateTitle(input: string): Evaluation {
  const title = titleSchema.parse(input);
  const t = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = title.split(/\s+/).length;
  const experimental = /in vitro|experimental|formulacion|ensayo/.test(t);
  const association = /asociacion|relacion|correlacion/.test(t);
  const design = experimental ? 'Posible estudio experimental o de desarrollo farmacotécnico; el título no confirma asignación, controles ni causalidad.' : association ? 'Posible estudio observacional de asociación; confirmar temporalidad, muestreo y control de confusión.' : 'No se puede establecer el diseño solo con este título.';
  const variables: string[] = [];
  if (/extracto|formulacion|dosis|concentracion/.test(t)) variables.push('Posible exposición o factor: formulación, extracto o concentración; precisar niveles y control.');
  if (/antifung|antimicrob/.test(t)) variables.push('Posible respuesta: actividad antimicrobiana; definir ensayo, unidad y criterio de interpretación.');
  if (/adherencia/.test(t)) variables.push('Constructo candidato: adherencia; definir instrumento, escala y punto de corte.');
  if (/fisicoquim/.test(t)) variables.push('Respuestas fisicoquímicas candidatas; especificar propiedades, métodos y unidades.');
  if (!variables.length) variables.push('No se identifican variables con suficiente confianza; declarar exposición, resultado e indicadores.');
  const findings: Finding[] = [
    { area: 'Claridad y precisión', fragment: title, observation: words > 35 ? `El título tiene ${words} palabras. Su extensión puede dificultar identificar el objetivo principal; no constituye un incumplimiento institucional.` : `El título tiene ${words} palabras. La extensión por sí sola no demuestra claridad científica.`, action: 'Identificar el objetivo principal y revisar términos con el asesor. Conservar las delimitaciones pertinentes.', status: 'Tentativo', severity: words > 35 ? 'Revisar' : 'Nota', basis: 'Regla editorial explícita del MVP: advertencia de legibilidad si supera 35 palabras; no es una norma universitaria.' },
    { area: 'Delimitación temporal', fragment: title.match(/\b(?:19|20|21)\d{2}(?:\s*[-–]\s*(?:19|20|21)\d{2})?\b/)?.[0] ?? 'No identificada', observation: /\b(?:19|20|21)\d{2}\b/.test(t) ? 'Se reconoce un año; confirmar si corresponde a ejecución, recolección o publicación.' : 'No se reconoce un año. El periodo puede ser pertinente según el diseño, pero no siempre debe figurar en el título.', action: 'Precisar periodo de estudio en el protocolo cuando corresponda.', status: 'Requiere información', severity: 'Nota', basis: 'Detección de años, sin validación metodológica.' },
    { area: 'Ámbito y unidad de análisis', fragment: /lima/.test(t) ? 'Lima' : 'No inferible con certeza', observation: /in vitro/.test(t) ? 'Se declara un ámbito in vitro. No equivale a eficacia clínica ni permite extrapolar resultados a pacientes.' : 'Confirmar lugar, población o material biológico y unidad de análisis; no todos son obligatorios en todo título.', action: 'Precisar cepas o población, procedencia, criterios de selección y unidad experimental.', status: 'Requiere información', severity: 'Revisar', basis: 'Alcance literal del término in vitro y limitación de inferencia del título.' },
    { area: 'Diseño y riesgos metodológicos', fragment: title, observation: design, action: experimental ? 'Documentar controles, réplicas biológicas y técnicas, estandarización, método de medición y bioseguridad. Evitar pseudorreplicación.' : 'Definir diseño, selección de participantes, mediciones, sesgos y análisis antes de elegir pruebas estadísticas.', status: 'Tentativo', severity: 'Revisar', basis: 'Inferencia por palabras clave. No se ha examinado un protocolo ni evidencia externa.' },
    { area: 'Relevancia, originalidad y viabilidad', fragment: title, observation: 'No evaluables con el título. No se han demostrado novedad, impacto ni factibilidad.', action: 'Buscar antecedentes pertinentes y aportar protocolo, presupuesto, infraestructura, cronograma y evaluación ética.', status: 'Requiere información', severity: 'Nota', basis: 'Ausencia de búsqueda bibliográfica vinculada y de información metodológica.' }
  ];
  const normalized = title.replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
  return { version: 'rules-1.0', evaluatedAt: new Date().toISOString(), title, words, design, variables, findings,
    questions: [ `¿Cómo se definirá y medirá el resultado principal de «${title}»?`, experimental ? '¿Qué diferencias se observarían entre la formulación y los controles bajo condiciones previamente definidas?' : '¿Cuál es la relación entre las variables propuestas en la población y periodo definidos?', '¿Qué antecedentes verificables justifican la pregunta y qué limitaciones tendrían sus resultados?' ],
    alternatives: [{ title: normalized, reason: 'Versión conservadora: normaliza espacios sin añadir población, resultados ni métodos. Validar la redacción con el asesor.' }, ...(title === EXAMPLE_TITLE ? [{ title: 'Caracterización fisicoquímica y actividad antifúngica in vitro frente a Candida albicans de gomitas sin azúcar con extracto estandarizado de kion, Lima, 2027', reason: 'Alternativa para el ejemplo: concentra los resultados de interés. Usar solo si la formulación no es un objetivo independiente y se confirman lugar y periodo.' }] : [])],
    missing: ['Protocolo y objetivo primario', 'Antecedentes verificados y brecha científica', 'Definiciones operacionales y métodos de medición', 'Muestra o unidades experimentales, controles y cálculo de tamaño', 'Recursos, costos y acceso a equipos o materiales', 'Cronograma, permisos, ética y bioseguridad', 'Plan de análisis y manejo de incertidumbre'] };
}

export const dimensionSchema = z.object({ id: z.string().min(1).max(80), name: z.string().min(1).max(180), weight: z.number().int().min(1).max(100), score: z.number().min(0).max(100).nullable(), evidence: z.string().max(4000), justification: z.string().max(4000), criterion: z.string().min(1).max(1500) });
export type Dimension = z.infer<typeof dimensionSchema>;
export const defaultRubric: Dimension[] = [
  ['originalidad', 'Originalidad y brecha científica', 15, 'Antecedentes verificados y comparación explícita con el aporte propuesto.'],
  ['relevancia', 'Relevancia e impacto potencial', 10, 'Necesidad documentada y contribución potencial razonada.'],
  ['coherencia', 'Problema, objetivos y coherencia', 15, 'Correspondencia explícita entre pregunta, objetivos y diseño.'],
  ['metodologia', 'Metodología', 15, 'Diseño, controles y procedimientos adecuados al objetivo.'],
  ['viabilidad', 'Viabilidad técnica y económica', 15, 'Recursos, permisos, presupuesto y cronograma documentados.'],
  ['variables', 'Variables y mediciones', 10, 'Definiciones operacionales, unidades e instrumentos justificados.'],
  ['estadistica', 'Plan estadístico', 10, 'Análisis compatible con diseño, variables, supuestos e incertidumbre.'],
  ['referencias', 'Calidad de referencias', 5, 'Fuentes verificadas, pertinentes y relacionadas con las afirmaciones.'],
  ['etica', 'Ética y cumplimiento normativo', 5, 'Requisitos aplicables identificados, permisos y protección documentados.']
].map(([id, name, weight, criterion]) => ({ id: String(id), name: String(name), weight: Number(weight), criterion: String(criterion), score: null, evidence: '', justification: '' }));
export const rubricSchema = z.array(dimensionSchema).min(1).max(30).superRefine((rows, ctx) => {
  if (rows.reduce((s, r) => s + r.weight, 0) !== 100) ctx.addIssue({ code: 'custom', message: 'Los pesos deben sumar 100.' });
  if (new Set(rows.map(r => r.id)).size !== rows.length) ctx.addIssue({ code: 'custom', message: 'Los identificadores deben ser únicos.' });
  for (const r of rows) {
    if (r.score !== null && (r.score > r.weight || !r.evidence.trim() || !r.justification.trim())) ctx.addIssue({ code: 'custom', message: `${r.name}: exige puntuación dentro del peso, evidencia y justificación.` });
  }
});
export function summarizeRubric(rows: Dimension[]) {
  rubricSchema.parse(rows);
  const evaluated = rows.filter(r => r.score !== null);
  return { points: evaluated.reduce((s, r) => s + r.score!, 0), covered: evaluated.reduce((s, r) => s + r.weight, 0), unevaluable: rows.filter(r => r.score === null).length, complete: evaluated.length === rows.length };
}
export const sourceSchema = z.object({ id: z.string(), provider: z.enum(['PubMed', 'Crossref']), title: z.string(), authors: z.array(z.string()), year: z.string(), journal: z.string(), doi: z.string().nullable(), url: z.url().refine(value => { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && ['doi.org', 'pubmed.ncbi.nlm.nih.gov', 'search.crossref.org'].includes(u.hostname); }, 'Enlace de fuente no permitido.'), abstract: z.string().nullable(), status: z.string(), consultedAt: z.string(), verification: z.string() });
export type Source = z.infer<typeof sourceSchema>;
export const searchRecordSchema = z.object({ query: z.string().min(2).max(300), provider: z.enum(['PubMed', 'Crossref']), filter: z.string(), consultedAt: z.string(), sources: z.array(sourceSchema).max(10), warnings: z.array(z.string()), error: z.string().optional() });
export type SearchRecord = z.infer<typeof searchRecordSchema>;
export const reviewSchema = z.object({ status: z.enum(['Pendiente', 'Aceptada', 'Rechazada']), note: z.string().max(4000) });
export const projectSchema = z.object({ id: z.string().max(80), name: z.string().min(1).max(160), title: titleSchema, createdAt: z.string(), updatedAt: z.string(), evaluation: z.custom<Evaluation>().nullable(), rubric: rubricSchema, searches: z.array(searchRecordSchema).max(30), reviews: z.record(z.string(), reviewSchema) });
export type Project = z.infer<typeof projectSchema>;
export function newProject(title: string): Project {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name: title.slice(0, 100), title, createdAt: now, updatedAt: now, evaluation: evaluateTitle(title), rubric: structuredClone(defaultRubric), searches: [], reviews: {} };
}
export function vancouver(s: Source) {
  return `${s.authors.length ? s.authors.slice(0, 6).join(', ') + (s.authors.length > 6 ? ', et al' : '') : '[Autores no disponibles]'}. ${s.title}. ${s.journal || '[Revista no disponible]'}. ${s.year || '[Año no disponible]'}. ${s.doi ? `doi:${s.doi}. ` : ''}Disponible en: ${s.url} [consultado ${s.consultedAt.slice(0, 10)}].`;
}
