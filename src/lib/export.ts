import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { evaluateTitle, summarizeRubric, vancouver, type Project } from './domain';
export function reportLines(project: Project): string[] {
  const e = evaluateTitle(project.title);
  const summary = summarizeRubric(project.rubric);
  return [
    'PHARMAACADEMIC AI · INFORME PRELIMINAR',
    `Proyecto: ${project.name}`, `Fecha del informe: ${new Date().toISOString()}`, `Última modificación: ${project.updatedAt}`, `Versión del análisis: ${e.version} · Documento: no cargado (fase 1)`,
    'Uso educativo. Análisis por reglas, sin modelo generativo. No sustituye al asesor ni al jurado. No demuestra originalidad, viabilidad o impacto.',
    'TÍTULO', project.title,
    'A. DIAGNÓSTICO POSIBLE CON EL TÍTULO', e.design, ...e.variables,
    ...e.findings.flatMap((f, i) => [`${f.area} · ${f.severity} · ${f.status}`, `Fragmento (título completo o coincidencia literal): ${f.fragment}`, f.observation, `Base: ${f.basis}`, `Corrección sugerida: ${f.action}`, `Seguimiento: ${project.reviews[String(i)]?.status ?? 'Pendiente'}; nota: ${project.reviews[String(i)]?.note ?? ''}`]),
    'PREGUNTAS DERIVADAS', ...e.questions,
    'ALTERNATIVAS', ...e.alternatives.flatMap(a => [a.title, a.reason]),
    'B. BÚSQUEDA BIBLIOGRÁFICA', 'Los metadatos recuperados no se han vinculado automáticamente a las afirmaciones del diagnóstico. La pertinencia debe revisarse.',
    ...project.searches.flatMap(s => [`${s.provider} · ${s.consultedAt} · Consulta: ${s.query} · ${s.filter}`, ...(s.error ? [`ERROR: ${s.error}`] : []), ...s.warnings, ...s.sources.flatMap(r => [vancouver(r), r.verification, r.status])]),
    'C. INFORMACIÓN NO EVALUABLE', ...e.missing,
    'RÚBRICA · VALORACIÓN MANUAL ORIENTATIVA',
    summary.complete ? `Total: ${summary.points}/100` : `Parcial: ${summary.points} puntos en ${summary.covered}/100 puntos evaluables; NO equivale a nota sobre 100.`,
    ...project.rubric.flatMap(r => [`${r.name}: ${r.score === null ? 'NO EVALUABLE' : `${r.score}/${r.weight}`}`, `Criterio: ${r.criterion}`, `Evidencia: ${r.evidence || 'No proporcionada'}`, `Justificación: ${r.justification || 'No proporcionada'}`]),
    'ACCIONES DE MEJORA', ...e.findings.map(f => f.action),
    'LÍMITES', 'No hay análisis de documentos, verificación exhaustiva de retractaciones, revisión del texto completo ni validación institucional. No ingresar datos identificables de pacientes. Referencias Vancouver básicas pendientes de revisión editorial.'
  ];
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportDocx(project: Project) {
  const lines = reportLines(project);
  const document = new Document({ sections: [{ children: lines.map((line, i) => new Paragraph({ ...(i === 0 ? {heading: HeadingLevel.TITLE} : {}), children: [new TextRun({text: line, size: i === 0 ? 32 : 22})], spacing: {after: 160} })) }] });
  downloadBlob(await Packer.toBlob(document), 'pharmaacademic-informe.docx');
}
