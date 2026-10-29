# Arquitectura y tareas verificables

## Fase 1

1. Núcleo determinista: entradas validadas, evaluación preliminar versionada y distinción entre título, evidencia y protocolo. Verificación: pruebas de límites y caso académico solicitado.
2. Rúbrica: criterios editables, pesos suman 100, IDs únicos, puntuación dentro de cada dimensión y evidencia/justificación obligatorias. Verificación: cero vs no evaluable, cobertura parcial y total.
3. Fuentes: API de servidor con dominios fijos, normalización, consulta y trazabilidad. Verificación: fixtures de ambas fuentes, errores explícitos; validación en vivo pendiente de acceso de red.
4. Persistencia: historial local y respaldos, importación validada, identificación nueva al importar. Verificación: recarga real del navegador y relectura de observaciones.
5. Exportación: un constructor de informe compartido para DOCX, texto e impresión PDF. Verificación: contenido del informe y descarga DOCX desde el navegador.
6. Interfaz responsive y límites visibles. Verificación: navegación móvil sin desbordamiento y módulos futuros sin resultados simulados.

## Modelo local

Un proyecto contiene identificador UUID, nombre/título, fechas, análisis por reglas, rúbrica, consultas con fuentes y seguimiento editable. Clave localStorage: `pharmaacademic.projects.v1`. Al abrir un respaldo o proyecto, el análisis se recalcula desde el título con la versión actual; no se interpreta un análisis importado como verificación. Las rúbricas y fuentes históricas mantienen su contenido y fecha de consulta. Exportar antes de una actualización de reglas si necesitas preservar el informe anterior. No hay versionado de documentos en fase 1.

## Migración a PostgreSQL (diseño, no implementado)

1. Añadir identidad y autorización antes de mover datos al servidor. No asumir que conocer un UUID concede acceso.
2. Crear tablas `users`, `projects` (owner_id, título, fechas), `evaluations` (project_id, rules_version, resultado JSONB, fecha), `rubric_versions`, `rubric_dimensions`, `searches` (consulta/filtros/proveedor/fecha), `sources`, `search_sources` y `finding_reviews`. Mantener scores NULL cuando no sean evaluables; validar pesos en transacción. Separar versiones de criterios de las evaluaciones históricas.
3. Implementar repositorio con interfaz load/save/delete en servidor; conservar los componentes de dominio independientes del ORM. Usar migraciones versionadas, consultas parametrizadas, integridad referencial y transacciones. La conexión y secretos solo en servidor.
4. Importar respaldos locales con consentimiento del usuario, esquema validado, deduplicación de fuentes por identificador y límites de tamaño; asignar propietario desde sesión autenticada. No copiar el navegador completo sin intervención del usuario.
5. Añadir backup/restauración probados, retención/borrado, cifrado en tránsito y reposo, auditoría mínima y aislamiento entre usuarios. Verificar permisos con pruebas de acceso cruzado y límites distribuidos.

No se requieren cambios en Python. PostgreSQL sustituiría el adaptador local; no está preparado en este MVP y no se afirma como operativo.

## Criterios científicos

Las reglas editoriales no son normas institucionales. La advertencia de 35 palabras solo sugiere revisar legibilidad. Las palabras clave no prueban diseño, causalidad ni variable operacionalizada. No se puntúa automáticamente ningún constructo. El usuario conserva responsabilidad de justificar notas con evidencia revisada. Los resultados de búsqueda no alimentan automáticamente la evaluación ni demuestran brecha científica. Vancouver y matriz de antecedentes son borradores a partir de metadatos, no síntesis de estudios.

Fuentes técnicas: [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/), [políticas de uso NCBI](https://www.ncbi.nlm.nih.gov/books/NBK25497/), [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/). El cliente sin clave limita consultas y usa máximo diez registros; para despliegues multiinstancia hace falta una cola/limitador compartido. El registro editorial debe verificarse con el aviso del editor cuando sea necesario.
