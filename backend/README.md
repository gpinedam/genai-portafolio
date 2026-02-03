# Backend - GenAI Portafolio

API REST con Flask + LangChain para chatbot conversacional con IA.

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   │
│   ├── config/              # Configuración
│   │   └── base.py          # Settings y variables de entorno
│   │
│   ├── core/                # Funcionalidades core
│   │   └── rate_limiter.py  # Sistema de limitación de uso
│   │
│   ├── domain/              # Modelos de dominio
│   │   └── models/
│   │
│   ├── orchestration/       # Orquestación de IA
│   │   ├── orchestrator.py  # LangChain orchestrator
│   │   ├── prompt/          # System prompts
│   │   │   └── system_prompt.jinja
│   │   └── tools/           # Herramientas del agente
│   │       ├── __init__.py
│   │       ├── csv_tool.py
│   │       └── time_tool.py
│   │
│   ├── api/                 # REST API
│   │   └── v1/
│   │       └── routes.py    # Endpoints: /chat, /health, /contacts
│   │
│   └── schemas/             # Pydantic schemas
│
├── test/
│   └── unit-tests/
│       ├── conftest.py
│       ├── test_api.py
│       └── test_rate_limiter.py
│
├── storage/                 # Almacenamiento local
│   └── info-table-genai.csv
│
├── main.py                  # Punto de entrada (Flask app)
├── pyproject.toml           # Configuración uv y dependencias
└── .env-example             # Variables de entorno de ejemplo
```

## 🚀 Características

- **Chat conversacional** con memoria de sesión
- **LangChain Agent** con herramientas personalizadas
- **Rate Limiting** por IP (configurable)
- **CORS habilitado** para cualquier origen
- **Sirve frontend estático** desde Flask
- **Tests unitarios** con pytest

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env-example`:

```bash
# AI Services
PROJECT_NAME=Portafolio GenAI
OPENAI_API_KEY=tu_api_key_aqui
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0
LIMIT_TOKENS=20000

# Rate Limiting
MAX_QUESTIONS_PER_USER=8        # Preguntas máximas por usuario
RATE_LIMIT_WINDOW_HOURS=2       # Horas de espera tras límite

# Server (opcional)
FLASK_HOST=0.0.0.0
FLASK_PORT=8000
FRONTEND_DIR=/ruta/a/frontend   # Por defecto: ../frontend
```

## 📦 Instalación

### Requisitos
- Python 3.11+
- `uv` instalado

### Setup

```bash
# 1. Instalar uv (si no lo tienes)
brew install uv

# 2. Crear entorno virtual
uv venv --python "$(which python3)"

# 3. Activar entorno
source .venv/bin/activate

# 4. Instalar dependencias
uv sync

# 5. Configurar .env
cp .env-example .env
# Editar .env con tu API key
```

## 🏃 Ejecución

### Modo desarrollo

```bash
# Desde la raíz del proyecto
./run_local.sh

# O desde backend/
cd backend
source .venv/bin/activate
uv run python main.py
```

La aplicación estará disponible en `http://localhost:8000`

### Con Flask CLI

```bash
cd backend
source .venv/bin/activate
uv run flask --app main:create_app run --host 0.0.0.0 --port 8000
```

## 🧪 Testing

```bash
cd backend
source .venv/bin/activate

# Todos los tests
python -m pytest test/unit-tests -v

# Solo tests de API
python -m pytest test/unit-tests/test_api.py -v

# Solo tests de rate limiter
python -m pytest test/unit-tests/test_rate_limiter.py -v

# Con coverage
python -m pytest test/unit-tests --cov=app --cov-report=html
```

## 📡 API Endpoints

### Health Check
```bash
GET /api/v1/health
```

Respuesta:
```json
{
  "status": "ok"
}
```

### Chat
```bash
POST /api/v1/chat
Content-Type: application/json

{
  "message": "Hola, ¿quién eres?",
  "session_id": "opcional-uuid"
}
```

Respuesta exitosa (200):
```json
{
  "reply": "Soy un asistente que puede ayudarte...",
  "session_id": "abc123",
  "remaining_questions": 7
}
```

Límite alcanzado (429):
```json
{
  "error": "Has alcanzado el límite de 8 preguntas. Por favor espera 1h 30m...",
  "remaining_questions": 0,
  "rate_limited": true
}
```

### Contactos (CSV)
```bash
GET /api/v1/contacts
```

Respuesta:
```json
{
  "contacts": [
    {
      "nombres": "Juan",
      "apellidos": "Pérez",
      "correo": "juan@example.com",
      "telefono": "123456789"
    }
  ]
}
```

## 🔐 Rate Limiting

El sistema limita el uso por dirección IP:

- Máximo de preguntas: `MAX_QUESTIONS_PER_USER` (default: 8)
- Tiempo de espera: `RATE_LIMIT_WINDOW_HOURS` (default: 2 horas)
- Identificación: Por IP (soporta `X-Forwarded-For`)
- Reset automático: Después del período de espera

Ver [documentación completa](../docs/RATE_LIMITING.md)

## 🛠️ Herramientas del Agente

Actualmente deshabilitadas (`TOOLS_ENABLED=False`). Para habilitar:

1. Editar `app/orchestration/tools/__init__.py`
2. Cambiar `TOOLS_ENABLED = True`
3. Reiniciar servidor

Herramientas disponibles:
- **CSV Tool**: Guardar contactos con validación
- **Time Tool**: Consultar zona horaria por país

## 📝 Notas de Desarrollo

- Las sesiones se mantienen en **memoria** (no persisten entre reinicios)
- Rate limiting usa **almacenamiento en memoria**
- Flask sirve tanto backend API como frontend estático
- CORS está habilitado para todos los orígenes (`origins: "*"`)

## 🐛 Troubleshooting

### Error: "No module named 'app'"
```bash
# Asegúrate de estar en backend/
cd backend
python main.py
```

### Tests fallan
```bash
# Verificar que el entorno esté activo
source .venv/bin/activate

# Reinstalar dependencias
uv sync
```

### Rate limiting no funciona
```bash
# Verificar variables en .env
cat .env | grep MAX_QUESTIONS

# Reiniciar servidor después de cambios
```

## 📚 Documentación Adicional

- [Guía de Rate Limiting](../docs/GUIA_RATE_LIMITING.md)
- [Quick Start](../docs/QUICK_START.md)
- [README Principal](../README.md)
