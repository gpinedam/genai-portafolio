# Frontend — GenAI Portafolio

UI estática del portafolio de George Pineda. Construida en **Vanilla HTML + CSS + JavaScript**, sin frameworks. Servida directamente por el backend Flask.

---

## Estructura

```
frontend/
├── index.html              # Único HTML — SPA con vistas controladas por JS
├── app.js                  # Toda la lógica de la UI (~900 líneas)
├── styles.css              # Estilos completos (~2300 líneas, sin preprocesador)
│
├── assets/
│   ├── avatar.png          # Ilustración del perfil
│   ├── AJE-DEMO.jpg        # Imagen del proyecto AJE
│   ├── INQUBE-CHATBOT.jpg  # Imagen del proyecto Inqube
│   ├── MAIA-REMAJU.jpg     # Imagen del proyecto MAIA
│   ├── MICROSOFT-KYCMCP.jpg
│   ├── pj1.jpg – pj5.jpg  # Imágenes genéricas de proyectos
│   └── download/
│       └── CV-PINEDA-GEORGE.pdf
│
└── content/                # Contenido dinámico (JSON + Markdown)
    ├── profile.json         # Datos personales, tiles, stack, contacto
    ├── home-panel.json      # Métricas, habilidades por categoría con niveles
    ├── quick-questions.json # Preguntas sugeridas para el chatbot
    ├── projects-list.json   # Lista de proyectos con metadatos
    └── projects/            # Descripción detallada en Markdown por proyecto
        ├── MICROSOFT-KYCMCP.md
        ├── GYS-RECLUT.md
        ├── GYS-LEGALDOC.md
        ├── GYS-MEDICALDOC.md
        ├── INTERCORP-LINEASCRED.md
        ├── MAIA-REMAJU.md
        ├── INQUBE-CHATBOT.md
        └── AJE-DEMO.md
```

---

## Arquitectura de la UI

El frontend es una **Single Page Application** sin router externo. Las "páginas" son secciones (`<section class="view">`) que se muestran/ocultan con clases de CSS.

```
body[data-view="home"]     → muestra .view-home
body[data-view="projects"] → muestra .view-projects
body[data-view="contact"]  → muestra .view-contact
body[data-view="chat"]     → muestra .view-chat
```

### Responsabilidades de `app.js`

| Función | Propósito |
|---|---|
| `initNav()` | Navegación entre vistas, estado activo en nav |
| `renderProfile()` | Carga `profile.json` y renderiza header + tiles |
| `renderHomePanel()` | Carga `home-panel.json` → métricas + tabs de skills |
| `renderProjects()` | Carga `projects-list.json` → grid de tarjetas |
| `createProjectCard()` | Genera HTML de cada tarjeta de proyecto |
| `openProjectModal()` | Carga Markdown del proyecto y lo muestra en modal |
| `initChat()` | Conecta con `/api/v1/chat/stream` (SSE) |
| `renderQuickQuestions()` | Carga `quick-questions.json` → pills del chat |

### Librerías externas (CDN)

| Librería | Uso | Carga |
|---|---|---|
| `marked.js` | Renderiza Markdown en modales de proyectos y respuestas del chat | `defer` |
| `DOMPurify` | Sanitiza HTML generado por marked | `defer` |

---

## Contenido (archivos JSON)

### `profile.json`
Datos del perfil personal: nombre, rol, disponibilidad, contacto, tiles informativos, stack de tecnologías.

```json
{
  "status": { "available": true, "text": "..." },
  "meta": { "name": "...", "role": "...", "tagline": "..." },
  "cv": { "path": "assets/download/...", "filename": "..." },
  "contact": { "email": "...", "linkedin": {...}, "phone": {...} },
  "tiles": [{ "icon": "📍", "label": "Ubicación", "value": "Lima, Perú" }],
  "stack": ["Python", "LangChain", ...]
}
```

### `home-panel.json`
Métricas destacadas e inventario de habilidades por categoría con niveles de 1 a 5.

```json
{
  "metrics": [{ "value": "99%", "label": "Reducción de tiempos operativos" }],
  "stack": [
    {
      "category": "IA Generativa",
      "skills": [
        { "name": "OpenAI API", "level": 5 },
        { "name": "LangChain", "level": 5 }
      ]
    }
  ],
  "industries": [{ "emoji": "💼", "label": "Banca" }]
}
```

**Niveles de habilidad (1–5):**
- `5` = Experto / uso en producción
- `4` = Avanzado
- `3` = Intermedio
- `2` = Básico
- `1` = En aprendizaje

### `projects-list.json`
Lista de proyectos con todos los metadatos necesarios para renderizar las tarjetas y el modal.

```json
[
  {
    "id": "microsoft-kycmcp",
    "title": "MCP para evaluacion de clientes en banca",
    "category": "Finanzas",
    "implementation": "enterprise",
    "type": "sin-demo",
    "featured": true,
    "image": "assets/MICROSOFT-KYCMCP.jpg",
    "tags": ["GPT-4.1", "MCP", "BACKEND"],
    "file": "MICROSOFT-KYCMCP.md",
    "demoUrl": null
  }
]
```

**Campos de `implementation`:** `enterprise` | `mvp` | `poc` | `demo`
**Campos de `type`:** `con-demo` | `sin-demo`

### `quick-questions.json`
Array de strings con preguntas sugeridas que aparecen como pills en el chat.

---

## Layout de Projects

La vista de proyectos usa un **grid 2 columnas**:
- El proyecto con `"featured": true` ocupa `grid-column: span 2` (fila completa).
- El resto ocupa 1 columna cada uno.
- Vista lista disponible vía toggle — colapsa a 1 columna.
- Filtros por categoría e industria generados dinámicamente desde `projects-list.json`.

---

## Chat (SSE Streaming)

El chat consume el endpoint `/api/v1/chat/stream` con **Server-Sent Events**:

```javascript
// Eventos recibidos:
{ "type": "session",  "session_id": "...", "remaining_questions": 7 }
{ "type": "chunk",    "content": "token..." }
{ "type": "error",    "content": "mensaje de error" }
{ "type": "done" }
```

El `session_id` se guarda en `sessionStorage` para mantener la conversación entre mensajes.

---

## CSS — Variables Globales

```css
:root {
  --yellow:        #f6c638;
  --yellow-deep:   #efb81d;
  --bg:            #06111e;
  --surface-0:     /* más oscuro */
  --surface-1:     /* cards */
  --surface-2/3:   /* elementos internos */
  --border:        /* bordes sutiles */
  --text-primary:  /* blanco puro */
  --text-secondary:/* gris claro */
  --text-muted:    /* gris oscuro */
  --card-radius:   28px;
  --font-ui:       "Futura", "Avenir Next", "Trebuchet MS", sans-serif;
}
```

---

## Notas

- **Sin framework ni bundler** — se sirve directamente como archivos estáticos.
- **Sin dependencias de npm** — todo via CDN o vanilla.
- **Contenido separado del código** — modificar JSON/Markdown sin tocar JS ni CSS.
- **Imágenes**: los `.jpg` de proyectos no están comprimidos — considerar WebP para producción.
