# Evidencia de validación de esta implementación

Entorno usado: Node 24.19.0, npm 11.9.0, Next.js 15.5.28 y Chromium disponible en `/usr/bin/chromium`.

- `npm test`: 12 pruebas ejecutadas, 12 aprobadas; no omitidas. Incluyen reglas, límites, rúbrica, transformaciones de metadatos y solicitudes con transporte controlado.
- `npm run typecheck`: aprobado.
- `npm run build`: compilación de producción aprobada; página principal estática y API de búsqueda dinámica.
- `npm run test:e2e`: 5 pruebas ejecutadas, 5 aprobadas con Chromium sobre el servidor de producción. Incluyen título ficticio solicitado, seguimiento editable, cero con justificación, recarga, descarga DOCX/JSON, restauración, impresión PDF, errores externos, consulta sintética vinculada y navegación móvil a 390 px sin desbordamiento.
- DOCX descargado: ZIP íntegro, `word/document.xml` contiene observaciones editadas, evidencia, versión y NO EVALUABLE. PDF generado mediante impresión de Chromium con cabecera PDF válida; no hay servicio PDF de servidor.
- Revisión visual de panel en 1440 px y 390 px. Sin errores JavaScript de página en el recorrido inicial.
- `git diff --check`: sin errores de espacios.

## Comprobación externa que no pasó

Conexiones HTTPS a `api.crossref.org` y `eutils.ncbi.nlm.nih.gov`: el proxy devolvió **403 CONNECT**. Por ello no se afirma que las búsquedas en vivo hayan sido validadas. Ambos dominios se guardaron en el borrador de configuración, junto con instrucciones de instalación y arranque. Ese guardado no aplica ni publica los cambios. Requiere revisar y guardar los ajustes y publicar el entorno; después repetir las consultas de ambas fuentes. No se solicitaron ni hacen falta claves para los endpoints públicos usados.

Los resultados sintéticos solo existen en `tests/` y están identificados como fixtures. No hay bibliografía ficticia precargada en el producto. La comprobación de error de interfaz usa una respuesta interceptada controlada y no cuenta como prueba de acceso real.

El workflow de GitHub Actions y el contenedor Codespaces están configurados; no se han ejecutado en GitHub en esta sesión. No se realizó commit, push, despliegue ni publicación. La aplicación local se inició con `npm run start`; un proceso no sobrevive necesariamente al cierre o publicación del entorno.
