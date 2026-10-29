import { projectSchema, type Project } from './domain';
const KEY = 'pharmaacademic.projects.v1';
export function loadProjects(): Project[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length > 50) throw new Error('Historial inválido. Exporta una copia antes de borrar los datos del navegador.');
  return parsed.map(p => {
    const project = projectSchema.parse(p);
    // El análisis se regenera desde el título; no se confía en resultados importados.
    project.evaluation = null;
    return project;
  });
}
export function storeProjects(projects: Project[]) {
  if (projects.length > 50) throw new Error('Límite de 50 proyectos. Exporta y elimina proyectos antiguos.');
  projects.forEach(p => projectSchema.parse(p));
  localStorage.setItem(KEY, JSON.stringify(projects));
}
