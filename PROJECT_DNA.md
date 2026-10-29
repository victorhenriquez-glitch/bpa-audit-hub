# Project DNA: BPA Audit Hub (Internal Agency MVP)
**Proyecto:** BPA Audit Hub  
**Líder de Producto:** Víctor Henríquez (Senior Technical SEO & Strategic Architect)  
**CTO Sponsor:** Jonie Iordache  
**Operaciones:** Alisha Hughes (Project/Operations Manager)  
**Colaboración Tooling:** Dino Ross (Software Engineer — BrightStart App)  
**Stack Real:** Node.js + Express (`server/index.js`), Vanilla JS ES6+, HTML5, Tailwind CSS, Chart.js, Replit PostgreSQL (en Replit) + Google OAuth (`@brightpinkagency.com`)  

---

## Contexto y Foco del MVP
* **100% Uso Interno de Agencia:** Diseñado para eliminar la fragmentación entre ClickUp, Excels, Master Workbooks y Google Docs en la gestión mensual de horas de retainer. No expone vistas públicas para clientes.
* **Flujo para Account Managers (Gyongyi, Ruben, Alisha, Carlos):** Acceso con cuenta corporativa de Google (`@brightpinkagency.com`), visualización de clientes asignados, control de minutos estimados vs. invertidos en el sprint, tickets técnicos de 4 partes sin alucinaciones y exportación a PDF / Markdown para armar reportes.
* **Fuente de Verdad de Datos:** `data/clients/*.json` genera `js/data-store.js` mediante `npm run build:data` (`node scripts/ingest_client.js --sync-bundle`). En Replit se persiste en PostgreSQL nativo con seed idempotente.
* **Test Suite Obligatorio (Regla 4):** Todo cambio en el código del Audit Hub DEBE pasar `node bpa-audit-hub/test_suite.js` al 100%.
