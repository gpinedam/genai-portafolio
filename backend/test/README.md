# Tests — Backend GenAI Portafolio

Tests unitarios para el backend del portafolio. Cubren los endpoints REST y el sistema de rate limiting.

---

## Estructura

```
test/unit-tests/
├── conftest.py             # Fixtures compartidos (cliente Flask de prueba)
├── test_api.py             # Tests de endpoints: /health, /chat, /contacts
└── test_rate_limiter.py    # Tests de RateLimiter: límites, ventanas, reset
```

---

## Requisitos

- Entorno virtual activo
- Dependencias de desarrollo instaladas

```bash
cd backend
source .venv/bin/activate
uv sync
```

---

## Ejecutar Tests

```bash
cd backend
source .venv/bin/activate

# Todos los tests
uv run pytest test/unit-tests -v

# Solo tests de API
uv run pytest test/unit-tests/test_api.py -v

# Solo tests de rate limiter
uv run pytest test/unit-tests/test_rate_limiter.py -v
```

---

## Coverage

```bash
# Reporte en terminal
uv run pytest test/unit-tests --cov=app --cov-report=term-missing

# Reporte HTML (abre backend/htmlcov/index.html)
uv run pytest test/unit-tests --cov=app --cov-report=html
```

---

## Qué se Testea

### `test_api.py`
- `GET /api/v1/health` → 200 + `{"status": "ok"}`
- `POST /api/v1/chat` → 400 si mensaje vacío
- `POST /api/v1/chat` → 429 si se excede el rate limit
- `GET /api/v1/contacts` → 200 + lista de contactos

### `test_rate_limiter.py`
- Primera solicitud de un IP nuevo: permitida
- Solicitudes dentro del límite: permitidas
- Solicitud que excede el límite: rechazada con mensaje de error
- Reset automático al cumplirse la ventana de tiempo
- `get_remaining_questions()` devuelve valor correcto

---

## Notas

- Los tests usan el cliente de prueba de Flask (`app.test_client()`) — no requieren servidor en ejecución.
- Las llamadas a OpenAI son mockeadas para no consumir tokens reales.
- El estado del `RateLimiter` es in-memory y fresco en cada test.
