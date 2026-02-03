# Tests (Backend)

## Requisitos
- `uv` instalado
- Dependencias sincronizadas

```bash
cd backend
uv sync --dev
```

## Ejecutar tests unitarios
```bash
cd backend
uv run pytest test/unit-tests
```

## Coverage
```bash
cd backend
uv run pytest --cov=app --cov-report=term-missing test/unit-tests
```

### Coverage HTML
```bash
cd backend
uv run pytest --cov=app --cov-report=html test/unit-tests
```

El reporte se genera en `backend/htmlcov/`.
