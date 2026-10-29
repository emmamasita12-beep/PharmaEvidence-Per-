# PharmaAcademic AI

MVP educativo en español para estudiantes e investigadores de Farmacia y Bioquímica. Next.js 15, React 19, TypeScript y Tailwind CSS 4. No requiere Python, claves de IA ni servicios de pago.

## Qué funciona en la fase 1

- Evaluación **preliminar por reglas**, no IA generativa: claridad, delimitación, variables tentativas, diseño probable, preguntas, alternativas conservadoras y datos faltantes. Cada observación muestra fragmento, fundamento, límite y acción sugerida. Se pueden editar notas y registrar aceptación, rechazo o pendiente.
- Rúbrica manual configurable de 100 puntos, inicialmente con nueve dimensiones. Puntuación vacía = **NO EVALUABLE**; cero = puntuación explícita con evidencia y justificación. Los parciales muestran cobertura y no se convierten automáticamente en nota sobre 100. Importación de criterios institucionales mediante JSON; no interpreta reglamentos PDF.
- Conectores reales de búsqueda de metadatos de PubMed E-utilities y Crossref, sin scraping. Consulta, filtro de año, fecha, identidad, autoría disponible, DOI, enlace, límites y alertas editoriales disponibles quedan registrados al vincular una consulta al proyecto.
- Historial local, respaldo/restauración JSON, informe DOCX editable, TXT e impresión a PDF desde el navegador.
- Diseño responsive en español, navegación por módulos y estados pendientes explícitos.

**Limitación de validación en este entorno:** el proxy devolvió HTTP 403 CONNECT para `api.crossref.org` y `eutils.ncbi.nlm.nih.gov`. Los conectores tienen pruebas con respuestas de referencia controladas, pero la consulta en vivo requiere aplicar los dominios permitidos y repetir el ensayo. La aplicación muestra errores reales; no devuelve artículos ficticios como sustitución. Las pruebas de interfaz de error interceptan la API y se identifican como pruebas, no consultas reales.

No se ha verificado automáticamente pertinencia de artículos, lectura de resumen/texto completo ni originalidad, impacto o viabilidad de una tesis. La detección de alertas editoriales por metadatos es parcial. La presencia de un DOI no demuestra calidad, vigencia ni respaldo de una afirmación. Las referencias Vancouver son **básicas**: antes de entregar, revisar autoría, abreviatura de revista, volumen, número, páginas y formato institucional. La matriz de antecedentes muestra los metadatos disponibles y deja objetivo, diseño, muestra y resultados como no extraídos.

## Ver la aplicación desde GitHub sin instalar Python

GitHub muestra el código; **GitHub Pages no ejecuta este servidor Next.js**.

1. Sube estos cambios a tu repositorio mediante un commit y push, o mediante una PR. Esta tarea no publica ni hace push automáticamente.
2. En GitHub abre **Code → Codespaces → Create codespace on main** (o la rama que contenga estos cambios).
3. Espera la preparación del contenedor; ejecutará `npm ci` con Node 22.
4. En la terminal del Codespace ejecuta `npm run dev`.
5. Abre **Ports**, localiza el puerto **3000** y selecciona **Open in Browser**. Mantén su visibilidad privada durante el MVP. Usa únicamente la URL que genere Codespaces.
6. En «Evaluar título», pulsa «Usar ejemplo ficticio», luego «Evaluar y guardar». Revisa observaciones y rúbrica; consulta fuentes y vincula la búsqueda antes de exportar.

Codespaces depende de disponibilidad y cuota de tu cuenta de GitHub. También puedes ejecutar los mismos comandos en cualquier entorno web con Node 22 o posterior.

## Desarrollo

```sh
cd /workspace/PharmaEvidence-Per-
npm ci
npm run dev
```

Node >=22 y npm. En un clon en otra ubicación, usa la raíz de ese clon. El servidor escucha en el puerto 3000. No se necesitan secretos para las consultas públicas actuales. No envíes información sensible en búsquedas: el servidor transmite la estrategia al proveedor seleccionado.

Destinos HTTPS necesarios para búsquedas: `api.crossref.org`, `eutils.ncbi.nlm.nih.gov`. Instalación: registro npm y destinos de paquetes autorizados por la plataforma. Se preserva verificación TLS. El cliente HTTP usa el proxy heredado cuando existe, mediante `EnvHttpProxyAgent`; no contiene credenciales ni las registra. No cambies las CA ni desactives comprobaciones para resolver bloqueos de red.

## Validación

```sh
npm test
npm run typecheck
npm run build
# Chromium existente en /usr/bin/chromium, o especifica CHROMIUM_PATH
npm run test:e2e
# Alternativa con el navegador administrado por Playwright:
npx playwright install chromium
PLAYWRIGHT_BUNDLED=1 npm run test:e2e
```

`npm test` ejecuta 12 pruebas de reglas, puntuación, metadatos, fallos y exportación del contenido. Las pruebas de conectores usan fixtures sintéticos y un transporte controlado; no prueban acceso a Internet. Playwright inicia el servidor de producción (requiere build previo), recorre evaluación/guardado/revisión/rúbrica/descargas, comprueba errores explícitos, móvil y validación de API. El workflow de CI está preparado, pero su ejecución en GitHub no se ha observado en esta tarea.

Consulta real, una vez habilitada la red, desde la pantalla de investigador o contra `GET /api/search?provider=PubMed&query=Zingiber%20officinale`. Con Crossref, `provider=Crossref`; `query` puede ser DOI o términos. `year` es opcional. Un 502 significa fallo externo, nunca búsqueda vacía. Un 429 exige esperar; no se debe reintentar en bucle.

## Producción y alcance de seguridad

```sh
npm ci
npm run build
npm run start
```

Despliegue Node compatible, por ejemplo un proyecto Next.js en un proveedor que permita funciones de servidor y salida HTTPS. Selecciona la rama que contenga la aplicación, comando `npm run build` y preset Next.js. No hay despliegue realizado. No configurar exportación estática: `/api/search` necesita servidor.

El MVP es **local, de un usuario por perfil del navegador**. No incluye cuentas, autorización multiusuario, cifrado local, sincronización ni protección contra acceso de otras personas al mismo navegador. `localStorage` puede perderse al borrar datos o cambiar de origen: exporta respaldos JSON. Máximo 50 proyectos y 30 consultas de diez registros por proyecto; la cuota del navegador puede ser inferior. Los errores de almacenamiento se muestran y el proyecto se conserva en memoria para exportarlo. Las notas de observación se guardan al pulsar «Guardar observaciones»; los cambios de rúbrica al validarla y guardarla. Abre un proyecto guardado antes de reanudar su edición.

El backend no recibe documentos ni proyectos, no guarda búsquedas en una base de datos y no registra su contenido. Valida fuente, longitud de consulta y año. Solo contacta dos destinos fijos (sin URL arbitraria); aplica timeout y límite secuencial por instancia. Los textos remotos se renderizan como texto, sin ejecutar HTML ni instrucciones. La importación JSON valida estructura, límites y destinos HTTPS de las fuentes; no procesa PDF/DOCX/PPTX en esta fase. Hay cabeceras contra framing y MIME sniffing. No existen claves en el cliente.

**Antes de abrirlo al público:** añadir autenticación, autorización por proyecto, protección de sesiones, límites distribuidos/por usuario, política de retención, consentimiento y revisión de privacidad, controles de abuso y auditoría sin datos sensibles. El limitador en memoria actual no se comparte entre instancias ni reemplaza esos controles. No ingresar datos identificables de pacientes reales. No emite prescripciones ni sustituye supervisión profesional. Turnitin no está conectado; cualquier integración futura requiere API oficial, licencia y autorización. Similitud no equivale a plagio.

## Arquitectura y siguientes fases

- `src/lib/domain.ts`: reglas versionadas, esquemas, rúbrica y tipos de proyecto.
- `src/lib/bibliography.ts`: transporte HTTPS y normalización de metadatos públicos.
- `src/app/api/search/route.ts`: frontera de servidor, validación y manejo de fallos.
- `src/lib/storage.ts`: persistencia local validada.
- `src/lib/export.ts`: informe común para DOCX/TXT/PDF.
- `src/components/workspace.tsx`: flujo académico y navegación.
- `tests/`: pruebas de dominio y navegador; `.github/workflows/ci.yml`: automatización.

Se usa almacenamiento JSON local del navegador como persistencia sencilla, no una base de datos relacional ni archivo compartido en servidor. La migración posterior a PostgreSQL y sus requisitos se describen en [docs/arquitectura.md](docs/arquitectura.md).

Fase 2 pendiente: extracción segura PDF/DOCX/PPTX, observaciones por capítulo y localización, auditoría afirmación/cita, comparación de versiones. Fase 3 pendiente: herramientas numéricas validadas, Farmacia Clínica académica, SOAP, función renal, jurado, viabilidad y costos. Fase 4 pendiente: identidades, colaboración, integraciones institucionales y despliegue seguro para usuarios externos. ALICIA/RENATI solo mediante interfaces permitidas; no hay extracción automatizada actual.

El título de kion/gomitas/Candida es una **propuesta ficticia de demostración**. No hay antecedentes precargados, datos experimentales, notas de originalidad ni resultados clínicos inventados.
