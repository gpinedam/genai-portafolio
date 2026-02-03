# Sistema de Rate Limiting

## Descripción

Este sistema implementa limitación de uso por dirección IP para evitar abuso del chatbot. Rastrea el número de preguntas realizadas por cada usuario y bloquea temporalmente el acceso cuando se alcanza el límite configurado.

## Componentes

### 1. RateLimiter (`app/core/rate_limiter.py`)

Clase que gestiona el conteo y validación de peticiones por IP.

**Métodos principales:**
- `check_limit(ip)`: Verifica si un IP puede hacer una pregunta
- `increment(ip)`: Incrementa el contador para un IP
- `get_remaining_questions(ip)`: Obtiene preguntas restantes

**Almacenamiento en memoria:**
```python
{
    "192.168.1.1": {
        "count": 5,
        "first_request": datetime(2026, 2, 2, 10, 0, 0)
    }
}
```

### 2. Integración en API (`app/api/v1/routes.py`)

El endpoint `/api/v1/chat` valida cada petición antes de procesarla:

1. Extrae la IP del cliente (considerando proxies con `X-Forwarded-For`)
2. Verifica el límite con `check_limit()`
3. Si está bloqueado, retorna HTTP 429
4. Si puede proceder, incrementa el contador
5. Retorna la respuesta con el contador de preguntas restantes

### 3. Frontend (`frontend/app.js`)

El frontend muestra un contador visual y maneja el bloqueo:

- Muestra preguntas restantes con código de colores:
  - Verde: 5+ preguntas restantes
  - Naranja: 3-4 preguntas restantes
  - Rojo: 1-2 preguntas restantes o bloqueado
  
- Al recibir HTTP 429:
  - Deshabilita el input y botón de envío
  - Muestra el mensaje de error con tiempo de espera
  - Actualiza el contador visual

## Configuración

Variables de entorno en `.env`:

```bash
# Número máximo de preguntas por usuario
MAX_QUESTIONS_PER_USER=8

# Horas de espera tras alcanzar el límite
RATE_LIMIT_WINDOW_HOURS=2
```

## Comportamiento

### Flujo normal:
1. Usuario hace pregunta 1-7: Se procesa normalmente
2. Usuario hace pregunta 8: Se procesa, pero queda en límite
3. Usuario intenta pregunta 9: Bloqueado por 2 horas

### Ventana de tiempo:
- El contador inicia desde la **primera pregunta**
- Después de **RATE_LIMIT_WINDOW_HOURS**, el contador se resetea automáticamente
- Un usuario puede hacer 8 preguntas y esperar 2 horas para otras 8

### Ejemplo:
```
10:00 AM - Primera pregunta (contador: 1/8, resetea a 12:00 PM)
10:05 AM - Segunda pregunta (contador: 2/8, resetea a 12:00 PM)
10:30 AM - Octava pregunta (contador: 8/8, resetea a 12:00 PM)
10:35 AM - Novena pregunta → BLOQUEADO hasta 12:00 PM
12:00 PM - Contador resetea automáticamente
12:01 PM - Primera pregunta nuevamente (contador: 1/8, resetea a 2:01 PM)
```

## Identificación de usuarios

El sistema usa la dirección IP para identificar usuarios:

```python
client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
if client_ip:
    client_ip = client_ip.split(",")[0].strip()
```

Esto permite:
- Funcionar detrás de proxies y load balancers
- Identificar correctamente al usuario final
- Evitar que usuarios compartan límites

## Respuestas de la API

### Petición exitosa (200):
```json
{
  "reply": "Respuesta del asistente",
  "session_id": "abc123",
  "remaining_questions": 5
}
```

### Límite alcanzado (429):
```json
{
  "error": "Has alcanzado el límite de 8 preguntas. Por favor espera 1h 45m para poder continuar.",
  "remaining_questions": 0,
  "rate_limited": true
}
```

## Limitaciones conocidas

1. **Almacenamiento en memoria**: Los contadores se pierden al reiniciar el servidor
2. **Proxies compartidos**: Usuarios detrás del mismo proxy/VPN comparten límites
3. **No persistente**: No hay base de datos para tracking histórico

## Mejoras futuras

- [ ] Almacenamiento en Redis para persistencia
- [ ] Rate limiting por sesión en lugar de solo IP
- [ ] Panel de administración para ver y resetear límites
- [ ] Whitelist de IPs para usuarios premium
- [ ] Logging de intentos bloqueados para análisis
- [ ] Rate limiting diferenciado por tipo de usuario
