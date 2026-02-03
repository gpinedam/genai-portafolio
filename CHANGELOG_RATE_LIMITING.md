# Resumen de Cambios - Sistema de Rate Limiting

## Fecha: 2 de febrero de 2026

## Objetivo
Implementar un sistema de limitación de uso del chatbot para evitar abuso, permitiendo máximo 8 preguntas por usuario con un período de espera de 2 horas.

## Archivos Creados

### 1. `/backend/app/core/rate_limiter.py`
**Nuevo módulo** que implementa la clase `RateLimiter`:
- Rastrea preguntas por dirección IP
- Valida límites antes de cada petición
- Calcula tiempo de espera cuando se alcanza el límite
- Resetea automáticamente después del período configurado

### 2. `/backend/test/unit-tests/test_rate_limiter.py`
**Tests unitarios** para validar el funcionamiento del rate limiter:
- 5 tests que cubren todos los casos de uso
- Todos los tests pasan exitosamente ✅

### 3. `/backend/docs/RATE_LIMITING.md`
**Documentación completa** del sistema:
- Descripción de componentes
- Flujos de comportamiento
- Ejemplos de configuración
- Limitaciones conocidas

## Archivos Modificados

### 1. `/backend/app/config/base.py`
**Agregadas nuevas variables de entorno:**
```python
self.MAX_QUESTIONS_PER_USER = int(os.getenv("MAX_QUESTIONS_PER_USER", "8"))
self.RATE_LIMIT_WINDOW_HOURS = int(os.getenv("RATE_LIMIT_WINDOW_HOURS", "2"))
```

### 2. `/backend/app/api/v1/routes.py`
**Integración del rate limiter:**
- Importa `RateLimiter` y lo inicializa como variable global
- Valida cada petición al endpoint `/chat`
- Extrae IP del cliente (considerando proxies)
- Retorna HTTP 429 cuando se alcanza el límite
- Incluye `remaining_questions` en todas las respuestas

### 3. `/backend/.env-example`
**Nuevas variables de configuración:**
```bash
MAX_QUESTIONS_PER_USER=8
RATE_LIMIT_WINDOW_HOURS=2
```

### 4. `/frontend/app.js`
**Actualización del cliente para manejar rate limiting:**
- Variables para tracking: `remainingQuestions`, `isRateLimited`
- Función `updateQuestionCounter()` para mostrar estado visual
- Manejo de respuesta HTTP 429 (límite alcanzado)
- Deshabilitación de input/botón cuando está bloqueado
- Actualización automática del contador con cada pregunta

### 5. `/frontend/index.html`
**Agregado elemento para mostrar contador:**
```html
<div class="question-counter" id="questionCounter"></div>
```

### 6. `/frontend/styles.css`
**Estilos para el contador de preguntas:**
- Diseño visual con fondo semitransparente
- Cambio de color según preguntas restantes
- Transiciones suaves

### 7. `/README.md`
**Actualizada la documentación:**
- Nuevas variables de entorno en la tabla de configuración
- Sección "Rate Limiting" con ejemplos de respuestas API
- Explicación del funcionamiento

### 8. `/backend/test/unit-tests/conftest.py`
**Corrección de import:**
- Cambiado `from app.main import create_app` a `from main import create_app`

## Características Implementadas

✅ Límite configurable de preguntas por usuario (variable de entorno)
✅ Período de bloqueo de 2 horas (configurable)
✅ Identificación por dirección IP
✅ Soporte para proxies (X-Forwarded-For)
✅ Contador visual en frontend con código de colores
✅ Mensajes claros con tiempo de espera restante
✅ Bloqueo del chat cuando se alcanza el límite
✅ Reset automático después del período de espera
✅ Tests unitarios completos
✅ Documentación técnica

## Variables de Entorno

```bash
# En .env
MAX_QUESTIONS_PER_USER=8           # Preguntas máximas por usuario
RATE_LIMIT_WINDOW_HOURS=2          # Horas de espera tras límite
```

## Respuestas de API

### Exitosa (200):
```json
{
  "reply": "...",
  "session_id": "...",
  "remaining_questions": 5
}
```

### Límite alcanzado (429):
```json
{
  "error": "Has alcanzado el límite de 8 preguntas. Por favor espera 1h 30m para poder continuar.",
  "remaining_questions": 0,
  "rate_limited": true
}
```

## Comportamiento del Sistema

1. **Primera pregunta**: Inicia el contador, usuario tiene 7 preguntas más
2. **Preguntas 2-7**: Se procesa normalmente, contador disminuye
3. **Pregunta 8**: Última pregunta permitida
4. **Pregunta 9+**: Bloqueado por 2 horas con mensaje de error
5. **Después de 2 horas**: Contador se resetea automáticamente

## Testing

```bash
cd backend
source .venv/bin/activate
python -m pytest test/unit-tests/test_rate_limiter.py -v
```

**Resultado**: ✅ 5 tests pasados

## Próximos Pasos Sugeridos

- [ ] Considerar migrar almacenamiento a Redis para persistencia
- [ ] Implementar whitelist de IPs para desarrollo/testing
- [ ] Agregar métricas de uso y bloqueos
- [ ] Panel de administración para gestionar límites

## Notas Técnicas

- El almacenamiento es **en memoria** (no persiste entre reinicios)
- La IP se obtiene de `X-Forwarded-For` para soporte de proxies
- Los contadores son independientes por IP
- El tiempo de bloqueo se calcula desde la primera pregunta
