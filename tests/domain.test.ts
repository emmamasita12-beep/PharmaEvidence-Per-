import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultRubric, evaluateTitle, EXAMPLE_TITLE, newProject, projectSchema, rubricSchema, summarizeRubric, vancouver } from '../src/lib/domain';
import { normalizeDoi, parseCrossref, parsePubmed, searchBibliography } from '../src/lib/bibliography';
import { reportLines } from '../src/lib/export';

test('el ejemplo solo permite conclusiones preliminares y no puntúa originalidad', () => {
 const e=evaluateTitle(EXAMPLE_TITLE);
 assert.match(e.design,/Posible/); assert.match(e.findings[4].observation,/No evaluables/);
 assert.equal(e.alternatives.length,2); assert.ok(e.missing.includes('Antecedentes verificados y brecha científica'));
 const p=newProject(EXAMPLE_TITLE); assert.ok(p.rubric.every(r=>r.score===null));
 assert.equal(summarizeRubric(p.rubric).covered,0);
});
test('no inventa lugar, año ni alternativas específicas para otro título',()=>{
 const e=evaluateTitle('Actividad antifúngica de gomitas de kion frente a Candida albicans en Cusco, 2028');
 assert.equal(e.alternatives.length,1); assert.ok(!e.alternatives[0].title.includes('Lima'));
 assert.throws(()=>evaluateTitle('Corto'));
 assert.throws(()=>evaluateTitle('a'.repeat(1001)));
});
test('cero demostrado y ausencia de información son estados distintos',()=>{
 const rows=structuredClone(defaultRubric);
 rows[0]={...rows[0],score:0,evidence:'Búsqueda documentada y protocolo comparados',justification:'Criterio explícito no cumplido según evaluación manual'};
 const sum=summarizeRubric(rows);assert.equal(sum.points,0);assert.equal(sum.covered,15);assert.equal(sum.unevaluable,8);assert.equal(sum.complete,false);
 rows[0].evidence='';assert.equal(rubricSchema.safeParse(rows).success,false);
});
test('valida pesos, IDs únicos y puntuación dentro de cada dimensión',()=>{
 let rows=structuredClone(defaultRubric);rows[0].weight=10;assert.equal(rubricSchema.safeParse(rows).success,false);
 rows=structuredClone(defaultRubric);rows[0].score=16;assert.equal(rubricSchema.safeParse(rows).success,false);
 rows=structuredClone(defaultRubric);rows[1].id=rows[0].id;assert.equal(rubricSchema.safeParse(rows).success,false);
 rows=rows.map((r,i)=>({...r,id:String(i),score:r.weight,evidence:'Evidencia revisada',justification:'Cumple el criterio documentado'}));
 assert.deepEqual(summarizeRubric(rows),{points:100,covered:100,unevaluable:0,complete:true});
});
test('Crossref conserva DOI, autoría y fecha sin inventar resultados',()=>{
 const records=parseCrossref({message:{items:[{DOI:'10.1234/test',title:['<i>Ensayo</i>'],author:[{family:'Pérez',given:'Ana'}],published:{'date-parts':[[2024]]},'container-title':['Revista de prueba']}] }},'2026-01-01');
 assert.equal(records[0].doi,'10.1234/test');assert.equal(records[0].title,'Ensayo');assert.equal(records[0].year,'2024');assert.equal(records[0].abstract,null);assert.match(vancouver(records[0]),/Pérez Ana/);
 assert.equal(normalizeDoi('https://doi.org/10.1234/test'),'10.1234/test');assert.equal(normalizeDoi('javascript:alert(1)'),null);
});
test('PubMed conserva identidad y alerta explícita de retractación',()=>{
 const records=parsePubmed({result:{uids:['123'],123:{title:'Ensayo',pubdate:'2023 Jan',authors:[{name:'Perez A'}],pubtype:['Retracted Publication'],articleids:[{idtype:'doi',value:'10.1234/test'}]}}},'2026-01-01');
 assert.match(records[0].status,/Retracted Publication/);assert.equal(records[0].url,'https://pubmed.ncbi.nlm.nih.gov/123/');assert.equal(records[0].abstract,null);
});
test('una búsqueda vacía no se transforma en evidencia de originalidad',async()=>{
 const fetcher=(async()=>new Response(JSON.stringify({esearchresult:{idlist:[]}}))) as typeof fetch;
 const result=await searchBibliography('PubMed','test',undefined,fetcher);assert.equal(result.sources.length,0);assert.equal(result.query,'test');assert.match(result.warnings[0],/no revisión sistemática/);
});
test('propaga fallos de proveedor y rechaza formatos malformados',async()=>{
 await assert.rejects(searchBibliography('Crossref','test',undefined,(async()=>new Response('',{status:503})) as typeof fetch),/503/);
 assert.throws(()=>parseCrossref({},'now'));assert.throws(()=>parsePubmed({},'now'));
});
test('el informe preserva no evaluables, versión, observaciones y estrategias',()=>{
 const p=newProject(EXAMPLE_TITLE);p.reviews['0']={status:'Aceptada',note:'Revisaré redacción'};
 const text=reportLines(p).join('\n');assert.match(text,/NO EVALUABLE/);assert.match(text,/NO equivale a nota sobre 100/);assert.match(text,/rules-1.0/);assert.match(text,/Revisaré redacción/);assert.match(text,/Documento: no cargado/);
});
test('respaldo rechaza enlaces de fuente ejecutables',()=>{
 const p=newProject(EXAMPLE_TITLE);
 const source=parseCrossref({message:{items:[{DOI:'10.1234/test',title:['Test']}] }},'2026-01-01')[0];
 p.searches=[{query:'test',provider:'Crossref',filter:'sin filtro',consultedAt:'2026-01-01',warnings:[],sources:[{...source,url:'javascript:alert(1)'}]}];
 assert.equal(projectSchema.safeParse(p).success,false);
});
test('PubMed transmite consulta, filtro y IDs para recuperar metadatos',async()=>{
 const calls:URL[]=[];
 const fetcher=(async(input:URL|string|Request)=>{
  const url=new URL(String(input));calls.push(url);
  return new Response(JSON.stringify(calls.length===1?{esearchresult:{idlist:['123']}}:{result:{uids:['123'],123:{title:'Registro de prueba',pubdate:'2024',pubtype:['Journal Article']}}}));
 }) as typeof fetch;
 const r=await searchBibliography('PubMed','Zingiber AND Candida',2020,fetcher);
 assert.equal(calls.length,2);assert.equal(calls[0].searchParams.get('term'),'Zingiber AND Candida');assert.equal(calls[0].searchParams.get('mindate'),'2020');assert.equal(calls[1].searchParams.get('id'),'123');assert.equal(r.sources[0].id,'pubmed:123');
});
test('Crossref consulta DOI exacto y conserva filtro de fecha',async()=>{
 let requested:URL|undefined;
 const fetcher=(async(input:URL|string|Request)=>{requested=new URL(String(input));return new Response(JSON.stringify({message:{items:[]}}));}) as typeof fetch;
 await searchBibliography('Crossref','10.1234/test',2022,fetcher);
 assert.equal(requested?.searchParams.get('filter'),'doi:10.1234/test,from-pub-date:2022-01-01');assert.equal(requested?.searchParams.get('rows'),'10');
});
