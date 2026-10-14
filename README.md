# 🌸 Bright Pink Agency — Technical SEO Audit Hub

Plataforma centralizada y dinámica de reportes técnicos de auditoría SEO para los clientes de Bright Pink Agency (ohDEER, US Lawns, PuroClean, Qualicare, Pacific Lawn Sprinklers).

Diseñada para resolver la tensión entre el backlog técnico completo (Screaming Frog / Semrush) y las horas facturables del retainer mensual de los Account Managers.

---

## 🚀 Despliegue en Vercel & GitHub (Guía Rápida)

Para publicar la plataforma en la web bajo tu cuenta de Vercel y el GitHub corporativo de la agencia:

### Paso 1: Inicializar el repositorio Git local
Abre PowerShell o terminal dentro de la carpeta `bpa-audit-hub`:
```powershell
cd c:\Users\LENOVO\OneDrive\Desktop\Consultas\bpa-audit-hub
git init
git add .
git commit -m "feat: Initial release of BPA Technical SEO Audit Hub"
```

### Paso 2: Crear el repositorio en GitHub
1. Inicia sesión en [GitHub](https://github.com/) con tu correo empresarial (`victor.henriquez@brightpinkagency.com`).
2. Crea un nuevo repositorio (puede ser privado o público) con el nombre: `bpa-audit-hub`.
3. Vincula y sube el código:
```powershell
git remote add origin https://github.com/TU-USUARIO/bpa-audit-hub.git
git branch -M main
git push -u origin main
```

### Paso 3: Conectar a Vercel
1. Ve a [Vercel](https://vercel.com/) e inicia sesión con tu GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona el repositorio `bpa-audit-hub`.
4. Deja la configuración por defecto (Framework Preset: *Other*) y haz clic en **Deploy**.
5. ¡Listo! En menos de 30 segundos tendrás tu URL en vivo (ejemplo: `https://bpa-audit-hub.vercel.app`), con protección de encabezados `noindex` ya configurada en `vercel.json` para no indexar datos internos de auditoría.

---

## 📁 Estructura del Proyecto

```
bpa-audit-hub/
├── assets/
│   └── BPA-logo.webp             # Logo oficial de Bright Pink Agency
├── data/
│   ├── agency-config.json        # Configuración de equipo, colores y clientes
│   └── clients/
│       ├── oh-deer.json          # Auditoría completa de ohDEER (5,692 URLs + 45 min Sprint)
│       └── us-lawns.json         # Auditoría pre-migración de US Lawns
├── index.html                    # Dashboard interactivo (Tailwind, Lucide, Chart.js)
├── vercel.json                   # Reglas de seguridad y headers noindex para Vercel
├── package.json
└── README.md
```

---

## 🎯 Cómo agregar una nueva auditoría mensual
Para agregar un nuevo cliente o actualizar un reporte mensual:
1. Duplica una plantilla en `data/clients/{nuevo-cliente}.json`.
2. Actualiza los números del rastreo (KPIs, Sprint, Backlog).
3. Agrega el nuevo cliente en `data/agency-config.json`.
4. Haz `git commit` y `git push`. Vercel actualizará la página automáticamente.
