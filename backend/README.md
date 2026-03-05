# Backend — GenAI Portafolio

API REST construida con **Flask + LangChain** que potencia el chatbot del portafolio de George Pineda. Sirve el frontend estático, gestiona sesiones conversacionales con memoria, rate limiting por IP y streaming SSE.

---

## Estructura del Proyecto

```
backend/
├── main.py                         # Entrypoint Flask (create_app)
├── pyproject.toml                  # Dependencias y configuración uv
├── .env-example                    # Plantilla de variables de entorno
│
├── app/
│   ├── config/
│   │   └── base.py                 # Settings: carga .env → objeto Settings
│   ├── core/
│   │   └── rate_limiter.py         # RateLimiter in-memory por IP
│   ├── api/
│   │   └── v1/routes.py            # Blueprint /api/v1 con todos los endpoints
│   └── orchestration/
│       ├── orchestrator.py         # LangChainOrchestrator (agente + memoria)
│       ├── prompt/
│       │   └── system_prompt.jinja # System prompt con CV de George (Jinja2)
│       └── tools/
│           ├── __init__.py         # build_tools() — deshabilitadas por defecto
│           ├── csv_tool.py         # Tool: guardar contactos en CSV
│           └── time_tool.py        # Tool: consultar hora por país
│
├── storage/
│   └── info-table-genai.csv        # Contactos guardados por el agente
│
└── test/unit-tests/
    ├── conftest.py
    ├── test_api.py
    └── test_rate_limiter.py
```

---

## Flujo de una Solicitud de Chat

```
Cliente
  │
  ▼
POST /api/v1/chat  (o /chat/stream)
  │
  ├─ RateLimiter.check_limit(ip)     → 429 si superó el límite
  ├─ RateLimiter.increment(ip)
  ├─ _get_orchestrator(session_id)   → crea o recupera sesión en memoria
  └─ LangChainOrchestrator.chat(msg)
       ├─ Agrega mensaje al historial
       ├─ Invoca LangGraph agent con historial completo
       └─ Retorna respuesta → reply al cliente
```

---

## Componentes Principales

### `main.py` — Flask App
- `create_app()` registra el blueprint `api_v1` y sirve el frontend estático.
- Sirve `index.html` en `/` y cualquier asset en `/<path>`.
- CORS abierto a todos los orígenes (`*`).
- Host/puerto configurables: `FLASK_HOST`, `FLASK_PORT`.

### `app/config/base.py` — Settings
Singleton `settings` cargado desde `backend/.env`:

| Atributo | Env Var | Default |
|---|---|---|
| `API_KEY` | `OPENAI_API_KEY` | — (requerido) |
| `AI_MODEL` | `OPENAI_MODEL` | `gpt-4.1-nano` |
| `TEMPERATURE` | `OPENAI_TEMPERATURE` | `0` |
| `MAX_QUESTIONS_PER_USER` | `MAX_QUESTIONS_PER_USER` | `8` |
| `RATE_LIMIT_WINDOW_HOURS` | `RATE_LIMIT_WINDOW_HOURS` | `2` |

### `app/core/rate_limiter.py` — RateLimiter
- In-memory: guarda `{ip: {count, first_request}}` en un `dict`.
- Reset automático al cumplirse la ventana de tiempo.
- Soporta cabecera `X-Forwarded-For` para proxies/CDN.
- **No persiste entre reinicios del servidor.**

### `app/orchestration/orchestrator.py` — LangChainOrchestrator
- Usa `create_agent` de LangGraph internamente.
- Mantiene `self.messages` como historial completo de la sesión.
- `chat()` — bloqueante, devuelve el state del agente.
- `chat_stream()` — generator de tokens para SSE, usa `StreamingCallbackHandler` + `queue.Queue` en hilo separado.
- System prompt renderizado con Jinja2 incluyendo fecha actual.

### `app/orchestration/tools/` — Herramientas del Agente

Deshabilitadas por defecto (`TOOLS_ENABLED = False`).

| Tool | Función |
|---|---|
| `csv_tool` | Guarda datos de contacto en `storage/info-table-genai.csv` |
| `time_tool` | Retorna la hora actual en un país dado |

Para habilitar: editar `TOOLS_ENABLED = True` en `tools/__init__.py` y reiniciar.

---

## Configuración

Crea un archivo `.env` a partir de `.env-example`:

```bash
cp .env-example .env
```

```env
# Requerido
OPENAI_API_KEY=sk-...

# Opcionales
OPENAI_MODEL=gpt-4.1-nano
OPENAI_TEMPERATURE=0
PROJECT_NAME=Portafolio GenAI
MAX_QUESTIONS_PER_USER=8
RATE_LIMIT_WINDOW_HOURS=2
FLASK_HOST=0.0.0.0
FLASK_PORT=8000
FRONTEND_DIR=../frontend
```

## Instalación

```bash
# Desde backend/
uv venv --python "$(which python3)"
source .venv/bin/activate
uv sync
```

## Ejecución

```bash
# Opción 1 — Python directamente
source .venv/bin/activate
uv run python main.py

# Opción 2 — Flask CLI
uv run flask --app main:create_app run --host 0.0.0.0 --port 8000

# Opción 3 — Script raíz
cd .. && ./run_local.sh
```

Disponible en: **http://localhost:8000**

## Testing

```bash
source .venv/bin/activate

# Todos los tests
uv run pytest test/unit-tests -v

# Solo API
uv run pytest test/unit-tests/test_api.py -v

# Solo rate limiter
uv run pytest test/unit-tests/test_rate_limiter.py -v

# Con coverage
uv run pytest test/unit-tests --cov=app --cov-report=term-missing
```

Ver [`test/README.md`](test/README.md) para más detalle.

## API Endpoints

Ver contrato completo en [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md).

```
GET  /api/v1/health         → {"status": "ok"}
POST /api/v1/chat           → {"reply", "session_id", "remaining_questions"}
POST /api/v1/chat/stream    → SSE: session | chunk | error | done
GET  /api/v1/contacts       → {"contacts": [...]}
```

```bash
# Chat rápido
curl -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "¿Cuál es la experiencia de George?", "session_id": ""}'
```

## Notas de Producción

- **Sesiones**: in-memory — considerar Redis para producción.
- **Rate Limiter**: in-memory — no escala en múltiples workers.
- **CORS**: `origins: "*"` — restringir en producción.
- **Secrets**: `.env` está en `.gitignore` — no commitear API keys.

## Troubleshooting

**`ModuleNotFoundError: No module named 'app'`** — ejecutar siempre desde `backend/`.

**Rate limiting no respeta cambios** — reiniciar el servidor resetea el estado in-memory.

**Tests fallan** — verificar `source .venv/bin/activate && uv sync`.

## Documentación Adicional

- [Contrato de API](../docs/API_CONTRACT.md)
- [Rate Limiting](../docs/RATE_LIMITING.md)
- [Quick Start](../docs/QUICK_START.md)
- [README Principal](../README.md)

