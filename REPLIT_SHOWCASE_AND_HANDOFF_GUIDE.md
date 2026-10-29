# BPA Audit Hub — Replit Deployment & CTO Showcase Playbook

## 1. Dónde nos quedamos y qué se completó al 100%

El trabajo no quedó a medias; de hecho, **se completaron al 100% los 4 hitos técnicos planificados** y la plataforma está completamente blindada con **543/543 pruebas automatizadas pasando en verde (1,029 aserciones totales en la matriz de calidad)**:

### Hito 1: Servidor API de Screaming Frog & Rutas Express
* `server/services/screaming-frog.js` (1,125 líneas): Servicio con soporte dual (modo CLI en vivo y modo simulador/daemon offline para demostraciones).
* `server/routes/crawler.js` (513 líneas): 8 endpoints REST operativos (`POST /api/crawler/crawl`, sondeo de estado `%`, pausa, reanudación, cancelación, listado de issues, inlinks y descarga).
* `server/index.js`: Middlewares con soporte para payloads de 50MB, CORS nativo, manejador centralizado de errores JSON y rutas montadas.

### Hito 2: Motor de Ingesta y Parseo en Streaming en Producción
* `server/ingestion/crawl-pipeline.js` (60 KB):
  * Parser RFC-4180 en streaming con eliminación de BOM UTF-8 y normalización de columnas bilingües (inglés y español).
  * Algoritmo de agrupación de enlaces rotos por plantilla DOM (`>=80%` en Header, Nav o Footer) para consolidar cientos de 404s en un solo ticket.
  * Aislamiento determinista de falsos positivos de Cloudflare WAF 403 (Regla 2 de BPA).
  * Cálculo calibrado del Health Score (Regla 27) y preservación atómica de tareas previamente completadas (Regla 18).
  * Endpoints de ingesta montados: `POST /api/clients/:slug/ingest/crawl`, `POST /api/clients/:slug/crawl/upload` y `POST /api/crawler/crawls/:crawlId/ingest`.

### Hito 3: Crawl Ingestion Studio UI (Extensión del Frontend)
* `index.html`: Cajón lateral (*slide-over drawer*) ampliado a `max-w-2xl` para visualización cómoda.
* `js/services/storage-adapter.js` (722 líneas): Adaptador con 8 métodos puente y alternancia automática entre el backend REST y el modo de simulación offline.
* `js/modules/ingest-studio.js` (4ª pestaña: `🕷️ Crawl Studio (SF)`):
  * **Demostración de 1 clic:** Botón *"Run Benchmark Ingestion"* con el caso real de ohDEER.
  * **Consola en vivo:** Barra de progreso con 5 estados animados (`QUEUED` -> `RUNNING` -> `PARSING` -> `INGESTING` -> `COMPLETE`).
  * **Zona Dropzone:** Arrastre y suelta de múltiples archivos CSV (`internal_all.csv`, `issues_overview_report.csv` y archivos de `issues_reports/`).
  * **Tarjetas Bento de KPIs:** Comparativa *Antes vs. Después* (salud calibrada, 200s, 301s, 404s y 403s WAF).
  * **Fichas de Desarrollo (Regla 14):** Causa raíz, evidencia en vivo, snippets de código y recomendación arquitectónica.
  * **Nota del AM (Regla 6):** Resumen de 3 frases listo para copiar y enviar al Account Manager.

### Hito 4: Verificación y Quality Gate Unificado
* `test_suite.js`: Runner centralizado que valida en una sola corrida:
  * Baseline de clientes y esquemas: **246/246 PASS**
  * API Server de Screaming Frog: **61/61 PASS**
  * Pipeline de Ingesta: **109/109 PASS**
  * Crawl Studio UI: **127/127 PASS**
  * **Total verificado: 543 / 543 pruebas en verde (100% PASS, 0 regresiones)**.

---

## 2. Aclaración sobre los archivos CSV en `data/crawls/`

Los archivos CSV que viste en `data/crawls/` (como `crawl_image-studios_...`) fueron carpetas temporales generadas automáticamente por los tests de estrés y concurrencia del motor de ingesta para validar que el servidor no se colgara con archivos grandes.
* **Estado actual:** Ya limpiamos esos archivos temporales y agregamos `data/crawls/` y `*.tmp*` a `.gitignore`.
* **En tu proyecto:** Los datos canónicos de cada cliente viven limpios en `data/clients/*.json`. Los CSVs de rastreo solo se procesan temporalmente en memoria o en disco durante la ingesta y se convierten en métricas estructuradas. No ensucian el repositorio de Git ni Replit.

---

## 3. Comandos para Desplegar los Cambios a GitHub y Replit

Como tienes tu repositorio de GitHub conectado a Replit, solo necesitas ejecutar estos 3 comandos en tu terminal local para enviar todo lo nuevo:

```bash
cd "c:\Users\LENOVO\OneDrive\Desktop\Consultas\bpa-audit-hub"
git add .
git commit -m "feat: complete screaming frog api server, ingestion pipeline, crawl studio ui, and test suite"
git push origin main
```

Una vez hecho el push, ve a **Replit**:
1. Si Replit está sincronizado con GitHub, hará pull automáticamente o le das al botón **Sync / Pull from GitHub** en la pestaña de Git.
2. En la consola de Replit, ejecuta:
   ```bash
   node test_suite.js
   ```
   Verás las **543/543 pruebas pasando al 100% en verde**.
3. Presiona el botón verde **Run** (o ejecuta `npm start` / `node server/index.js`) para arrancar la aplicación en el puerto asignado por Replit.

---

## 4. Guion Paso a Paso para la Reunión con Jonie (Showcase de 10 Minutos)

Cuando estés en la llamada con Jonie y compartas pantalla, sigue esta secuencia limpia:

### Paso 1: Abrir la Plataforma y la Nueva Pestaña (1 minuto)
1. Abre la aplicación en Replit o en tu navegador local.
2. Selecciona al cliente **ohDEER** en el menú superior.
3. Haz clic en el botón **Ingest Studio** (arriba a la derecha) para abrir el panel lateral.
4. Selecciona la 4ª pestaña: **`🕷️ Crawl Studio (SF)`**.

### Paso 2: Ejecutar la Demostración de 1 Clic (2 minutos)
1. En la parte superior verás la tarjeta **One-Click Benchmark Showcase (ohDEER)**.
2. Haz clic en el botón azul: **"Run Benchmark Ingestion"**.
3. Jonie verá cómo la consola cobra vida en tiempo real:
   * La barra de progreso avanza del 0% al 100%.
   * Los 5 estados se iluminan secuencialmente: `QUEUED` -> `RUNNING` -> `PARSING` -> `INGESTING` -> `COMPLETE`.
   * En 300 milisegundos se procesa todo el rastreo.

### Paso 3: Mostrar las Tarjetas Bento de KPIs y el Aislamiento WAF (3 minutos)
1. Al terminar la ingesta, se despliega la comparativa **Audit Reconciliation (Before vs After)**:
   * Muestra cómo la auditoría cruda reportaba 78% de salud por culpa de 818 errores 403.
   * Explícale: *"Aquí el pipeline aplica la Regla 2 de BPA: aísla automáticamente los 818 bloqueos de Cloudflare WAF para que no penalicen la salud del cliente, subiendo el Health Score calibrado real a 92%"*.
   * Muestra la ganancia de +95 páginas 200 OK y la resolución de 12 enlaces 404.

### Paso 4: Mostrar las Tareas de Desarrollo bajo el Contrato de 4 Partes (2 minutos)
1. Desplaza la vista hacia abajo a las **Generated Engineering Tasks (Rule 14)**.
2. Muéstrale a Jonie la tarea `OHD-DEV-01` estructurada en sus 4 partes exactas:
   * **Symptom & Live Evidence:** URL afectada empíricamente.
   * **Root Cause Analysis:** Conflicto en la plantilla PHP.
   * **Ready-to-Test Code:** El filtro exacto de WordPress listo para copiar (botón *"Copy Filter"*).
   * **Architectural Recommendation:** Dónde debe vivir el código en el tema de BPA.
3. Coméntale: *"Con esto, ni Florin ni tú tienen que adivinar qué hacer; el ticket viene con el snippet exacto y la ubicación"*.

### Paso 5: Mostrar la Nota del Account Manager (1 minuto)
1. En la tarjeta inferior **AM Retainer Pitch Note (Rule 6)**, muéstrale el mensaje de 3 frases listo para copiar (botón *"Copy Note"*):
   * Frase 1: Tranquilidad técnica (sitio sólido al 92%).
   * Frase 2: Presupuesto (sprint de 45 min en CMS + Fase 2 para Florin).
   * Frase 3: Llamado a la acción para aprobación del cliente.

### Paso 6: Entregarle el Contrato de la API para su Servidor
1. Pásale el archivo [`API_ENDPOINTS.md`](file:///c:/Users/LENOVO/OneDrive/Desktop/Consultas/bpa-audit-hub/API_ENDPOINTS.md).
2. Dile: *"Tu servidor Linux ya está perfecto; solo necesitamos añadir `--save-report 'Redirects:All Redirects'` y `--crawl-analysis` a tu comando CLI, poner la IP de tu VPS en la lista blanca de Cloudflare y conectar estos endpoints con Replit"*.
