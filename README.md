# GenAI Portafolio

## Resumen ejecutivo
GenAI Portafolio es un sitio web con chat de IA que presenta el perfil profesional de George Pineda y responde consultas basadas en un prompt de CV. El frontend es estatico y se sirve desde el backend Flask, el cual expone una API REST para el chat.

## Caracteristicas clave
- Chat conversacional con memoria de sesion en backend.
- Prompt controlado con informacion del CV y politicas de respuesta.
- Frontend listo para consumo directo desde el servidor Flask.
- Endpoint de salud para verificacion rapida.

## Arquitectura (alto nivel)
- Frontend estatico: `frontend/` (HTML, CSS, JS).
- Backend API: `backend/` (Flask + LangChain + OpenAI).
- Orquestacion: `backend/app/orchestration/` (agent, tools, prompt).

## Stack tecnologico
- Backend: Python 3.11, Flask, LangChain, OpenAI SDK.
- Frontend: HTML, CSS, JavaScript.

## Requisitos
- Python 3.11+
- `uv` instalado
- Clave de API de OpenAI

## Instalar uv
Opcion recomendada (Homebrew en macOS):
```bash
brew install uv
```

Alternativa (instalador oficial):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
Despues de instalar, recarga el PATH:
```bash
source "$HOME/.local/bin/env"
```

## Configuracion de entorno
1. Copia el archivo de ejemplo y ajusta valores:
   - `backend/.env-example` -> `backend/.env`
2. Variables disponibles:

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `PROJECT_NAME` | Nombre del proyecto mostrado en prompts | `Portafolio GenAI` |
| `OPENAI_API_KEY` | API key de OpenAI | `sk-...` |
| `OPENAI_MODEL` | Modelo a utilizar | `gpt-4.1-nano` |
| `OPENAI_TEMPERATURE` | Temperatura del modelo | `0` |
| `LIMIT_TOKENS` | Limite de tokens (uso interno) | `20000` |
| `LIMIT_QUESTIONS` | Limite de preguntas (uso interno) | `10` |
| `MAX_QUESTIONS_PER_USER` | Máximo de preguntas por usuario (rate limiting) | `8` |
| `RATE_LIMIT_WINDOW_HOURS` | Horas de espera tras alcanzar el límite | `2` |
| `FRONTEND_DIR` | Ruta absoluta al frontend estatico (opcional) | `/var/www/frontend` |

## Instalacion local (backend con uv)
```bash
cd backend
uv venv --python "$(which python3)"
source .venv/bin/activate
uv sync
```

## Ejecutar en local
### Backend (sirve tambien el frontend)
```bash
cd backend
source .venv/bin/activate
uv run flask --app main:create_app run --host 0.0.0.0 --port 8000
```

Abre `http://localhost:8000` para ver el sitio.

### Script rapido (desde la raiz)
```bash
./run_local.sh
```

## API
- `GET /api/v1/health` -> estado del servicio.
- `POST /api/v1/chat` -> envia un mensaje y recibe respuesta.

Ejemplo:
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Hola","session_id":""}'
```

### Rate Limiting
El sistema incluye limitación de uso por IP para evitar abuso:
- Cada IP puede hacer hasta `MAX_QUESTIONS_PER_USER` preguntas (por defecto: 8)
- Al alcanzar el límite, se debe esperar `RATE_LIMIT_WINDOW_HOURS` horas (por defecto: 2 horas)
- El contador se muestra en el chat para que el usuario sepa cuántas preguntas le quedan
- El endpoint retorna código HTTP 429 cuando se alcanza el límite

Respuesta del endpoint `/chat`:
```json
{
  "reply": "Respuesta del asistente",
  "session_id": "abc123",
  "remaining_questions": 5
}
```

Cuando se alcanza el límite (HTTP 429):
```json
{
  "error": "Has alcanzado el límite de 8 preguntas. Por favor espera 1h 45m para poder continuar.",
  "remaining_questions": 0,
  "rate_limited": true
}
```

## Notas operativas
- Las sesiones se mantienen en memoria del proceso (no hay persistencia).
- El frontend asume que el backend esta en el mismo origen (`/api/v1/chat`).

## Estructura del repo
- `backend/`: API y orquestacion IA.
- `frontend/`: UI estatica.

## Roadmap sugerido
- Persistencia de sesiones y contactos.
- Manejo de configuraciones por entorno.
- Pruebas automatizadas y CI.
