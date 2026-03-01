# GenAI Portafolio — George Pineda

Portafolio profesional interactivo de **George Pineda**, AI Engineer especializado en IA Generativa, agentes conversacionales y soluciones multiagente. El sitio incluye un chatbot impulsado por LLM que responde preguntas sobre el perfil y experiencia del autor.

---

## ¿Qué hace este proyecto?

- Presenta el perfil, proyectos y stack tecnológico de George Pineda.
- Expone un chatbot conversacional con memoria de sesión que responde preguntas sobre el CV.
- El frontend estático es servido directamente por el backend Flask, sin necesidad de servidor web externo.
- Incluye rate limiting por IP para evitar abuso del endpoint de chat.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Navegador                        │
│   HTML + CSS + Vanilla JS  (frontend/)              │
│   - profile.json, projects-list.json, home-panel.json│
│   - content/*.md  (cargados on-demand por modal)   │
└──────────────────────┬──────────────────────────────┘
                       │  HTTP / SSE
┌──────────────────────▼──────────────────────────────┐
│             Flask App  (backend/)                   │
│  main.py → create_app()                             │
│  ├── GET  /                  → sirve index.html     │
│  ├── GET  /<path>            → assets estáticos     │
│  └── Blueprint /api/v1/                             │
│       ├── GET  /health                              │
│       ├── POST /chat          (blocking)            │
│       ├── POST /chat/stream   (SSE streaming)       │
│       └── GET  /contacts                            │
│                                                     │
│  Orchestration                                      │
│  ├── LangChainOrchestrator (memoria de sesión)      │
│  ├── LangChain Agent (create_agent / LangGraph)     │
│  ├── system_prompt.jinja  (CV + reglas del bot)     │
│  └── Tools: csv_tool, time_tool (deshabilitadas)    │
│                                                     │
│  Core                                               │
│  └── RateLimiter (in-memory, por IP)                │
└─────────────────────────────────────────────────────┘
```

---

## Estructura del Repositorio

```
genai-portafolio/
├── frontend/                 # UI estática
│   ├── index.html
│   ├── app.js                # Toda la lógica de UI (vanilla JS)
│   ├── styles.css            # Estilos completos (~2300 líneas)
│   ├── assets/               # Imágenes de proyectos, avatar, CV PDF
│   └── content/              # Contenido en JSON y Markdown
│       ├── profile.json      # Datos personales, tiles, stack
│       ├── home-panel.json   # Métricas, habilidades por categoría
│       ├── quick-questions.json
│       ├── projects-list.json
│       └── projects/*.md     # Descripción detallada por proyecto
│
├── backend/                  # API REST + serving del frontend
│   ├── main.py               # Entrypoint Flask
│   ├── pyproject.toml        # Dependencias (uv)
│   ├── .env-example          # Variables de entorno de ejemplo
│   ├── app/
│   │   ├── api/v1/routes.py  # Endpoints REST
│   │   ├── config/base.py    # Settings desde .env
│   │   ├── core/rate_limiter.py
│   │   └── orchestration/
│   │       ├── orchestrator.py
│   │       ├── prompt/system_prompt.jinja
│   │       └── tools/        # csv_tool, time_tool
│   ├── storage/
│   │   └── info-table-genai.csv
│   └── test/unit-tests/
│
├── docs/                     # Documentación extendida
│   ├── API_CONTRACT.md       # Contrato completo de la API
│   ├── RATE_LIMITING.md
│   └── QUICK_START.md
│
├── run_local.sh              # Script de arranque rápido
└── setup_terminal.sh
```

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3.11, Flask, Flask-CORS |
| IA / LLM | LangChain, LangGraph, OpenAI API |
| Prompt | Jinja2 |
| Tests | pytest, pytest-cov |
| Gestor de paquetes | uv |
| Modelo por defecto | gpt-4.1-nano |

---

## Requisitos

- Python 3.11+
- [`uv`](https://github.com/astral-sh/uv) instalado
- API Key de OpenAI

### Instalar uv

```bash
# macOS (Homebrew)
brew install uv

# Instalador oficial
curl -LsSf https://astral.sh/uv/install.sh | sh
source "$HOME/.local/bin/env"
```

---

## Configuración de Entorno

Copia el archivo de ejemplo y edita los valores:

```bash
cp backend/.env-example backend/.env
```

| Variable | Descripción | Default |
|---|---|---|
| `OPENAI_API_KEY` | API Key de OpenAI | — (requerida) |
| `OPENAI_MODEL` | Modelo LLM a usar | `gpt-4.1-nano` |
| `OPENAI_TEMPERATURE` | Temperatura del modelo | `0` |
| `PROJECT_NAME` | Nombre del proyecto | `Portafolio GenAI` |
| `LIMIT_TOKENS` | Límite de tokens (referencial) | `20000` |
| `MAX_QUESTIONS_PER_USER` | Preguntas máx. por IP | `8` |
| `RATE_LIMIT_WINDOW_HOURS` | Horas de espera al alcanzar límite | `2` |
| `FLASK_HOST` | Host del servidor | `0.0.0.0` |
| `FLASK_PORT` | Puerto del servidor | `8000` |
| `FRONTEND_DIR` | Ruta al frontend | `../frontend` |

---

## Instalación y Ejecución Local

```bash
# 1. Instalar dependencias del backend
cd backend
uv venv --python "$(which python3)"
source .venv/bin/activate
uv sync

# 2. Configurar variables de entorno
cp .env-example .env
# Editar .env y colocar OPENAI_API_KEY

# 3. Ejecutar
uv run python main.py
```

O con el script de la raíz:

```bash
./run_local.sh
```

Accede en: **http://localhost:8000**

---

## API (resumen)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/health` | Estado del servicio |
| `POST` | `/api/v1/chat` | Chat bloqueante |
| `POST` | `/api/v1/chat/stream` | Chat con streaming SSE |
| `GET` | `/api/v1/contacts` | Contactos guardados (CSV) |

Ver contrato completo en [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

---

## Rate Limiting

- Límite por IP: `MAX_QUESTIONS_PER_USER` preguntas en una ventana de `RATE_LIMIT_WINDOW_HOURS` horas.
- Identificación: cabecera `X-Forwarded-For` o `request.remote_addr`.
- Al superar el límite: HTTP 429 con tiempo de espera restante.
- Almacenamiento: **en memoria** (se resetea al reiniciar el servidor).

---

## Tests

```bash
cd backend
source .venv/bin/activate
uv run pytest test/unit-tests -v
```

---

## Notas Importantes

- Las **sesiones del chatbot** se mantienen en memoria del proceso — no persisten entre reinicios.
- El **rate limiter** también es in-memory — se resetea al reiniciar.
- **CORS** está abierto a todos los orígenes (`*`) — ajustar para producción.
- Las **herramientas del agente** (csv_tool, time_tool) están deshabilitadas por defecto (`TOOLS_ENABLED=False`).

