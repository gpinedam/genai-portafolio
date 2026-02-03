# Guía de Uso - Sistema de Rate Limiting

## 🎯 Objetivo
Limitar el uso del chatbot a un máximo de preguntas por usuario, con un período de espera después de alcanzar el límite.

## ⚙️ Configuración

### 1. Variables de Entorno

Edita el archivo `/backend/.env` y agrega/modifica estas variables:

```bash
# Número máximo de preguntas por usuario
MAX_QUESTIONS_PER_USER=8

# Horas de espera tras alcanzar el límite
RATE_LIMIT_WINDOW_HOURS=2
```

**Nota**: Si el archivo `.env` no existe, copia `.env-example`:
```bash
cd backend
cp .env-example .env
```

### 2. Valores Recomendados

| Escenario | MAX_QUESTIONS_PER_USER | RATE_LIMIT_WINDOW_HOURS |
|-----------|------------------------|-------------------------|
| Demo pública | 5-8 | 2-4 |
| Desarrollo | 100 | 0.5 |
| Producción | 10-15 | 1-2 |
| Sin límite | 1000 | 24 |

## 🚀 Ejecución

### Iniciar el servidor

```bash
cd backend
source .venv/bin/activate
uv run flask --app main:create_app run --host 0.0.0.0 --port 8000
```

O usar el script rápido desde la raíz:
```bash
./run_local.sh
```

### Probar el rate limiting

```bash
# Desde la raíz del proyecto
./test_rate_limiting.sh
```

Este script hará 10 peticiones consecutivas:
- Las primeras 8 deberían procesarse correctamente ✅
- Las últimas 2 deberían ser bloqueadas 🚫

## 🎨 Experiencia del Usuario

### Contador Visual

El usuario verá un contador de preguntas en el chat:

- **Verde** (5+ preguntas): `📊 Preguntas restantes: 7`
- **Naranja** (3-4 preguntas): `📊 Preguntas restantes: 3`
- **Rojo** (1-2 preguntas): `📊 Preguntas restantes: 1`
- **Bloqueado**: `⚠️ Chat bloqueado. Espera el tiempo indicado.`

### Mensaje de Bloqueo

Cuando el usuario alcanza el límite, ve:

```
Has alcanzado el límite de 8 preguntas. 
Por favor espera 1h 30m para poder continuar.
```

El input y botón se deshabilitan automáticamente.

## 🔧 Personalización

### Cambiar el número máximo de preguntas

Edita `.env`:
```bash
MAX_QUESTIONS_PER_USER=15  # Permite 15 preguntas
```

Reinicia el servidor para aplicar cambios.

### Cambiar el tiempo de espera

Edita `.env`:
```bash
RATE_LIMIT_WINDOW_HOURS=1  # Bloqueo de 1 hora
```

### Mensajes personalizados

Edita `/backend/app/core/rate_limiter.py`, línea ~65:

```python
message = (
    f"Has alcanzado el límite de {self.max_questions} preguntas. "
    f"Por favor espera {hours}h {minutes}m para poder continuar."
)
```

Cambia el texto según prefieras.

## 🧪 Testing

### Tests Unitarios

```bash
cd backend
source .venv/bin/activate
python -m pytest test/unit-tests/test_rate_limiter.py -v
```

### Test Manual con cURL

```bash
# Pregunta 1
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola","session_id":""}'

# Repetir hasta alcanzar el límite...
# La respuesta incluirá: "remaining_questions": 7

# Después de 8 preguntas, recibirás HTTP 429:
# {"error": "Has alcanzado el límite...", "rate_limited": true}
```

## 🐛 Solución de Problemas

### El límite no se aplica

1. Verifica que las variables estén en `.env`
2. Reinicia el servidor
3. Verifica que el archivo `.env` esté en `/backend/.env`

### El contador no se muestra en el frontend

1. Limpia la caché del navegador
2. Verifica que [frontend/index.html](frontend/index.html#L97-L99) tenga el elemento `questionCounter`
3. Revisa la consola del navegador para errores

### Los tests fallan

1. Verifica que el entorno virtual esté activo
2. Instala dependencias: `uv sync`
3. Verifica imports en [conftest.py](backend/test/unit-tests/conftest.py)

## 📊 Monitoreo

### Ver actividad en logs

El sistema registra las IPs bloqueadas. Para ver logs en tiempo real:

```bash
cd backend
source .venv/bin/activate
uv run flask --app main:create_app run --debug
```

### Estadísticas (futuro)

Para implementar estadísticas, considera agregar:
- Logging a archivo de bloqueos
- Métricas de uso por hora/día
- Dashboard de administración

## 🔒 Seguridad

### Consideraciones

- **IPs detrás de proxy**: El sistema usa `X-Forwarded-For` para identificar la IP real
- **VPNs compartidas**: Usuarios de la misma VPN comparten límites
- **Almacenamiento en memoria**: Los límites se resetean al reiniciar el servidor

### Recomendaciones

1. **Producción**: Considera usar Redis para persistencia
2. **Alta disponibilidad**: Implementa almacenamiento compartido entre instancias
3. **Logging**: Registra intentos de abuso para análisis

## 📝 Notas Importantes

- ⚠️ El almacenamiento es **temporal** (en memoria)
- ⚠️ Reiniciar el servidor **resetea todos los contadores**
- ⚠️ Usuarios detrás del **mismo proxy comparten límites**
- ✅ El sistema funciona **sin base de datos**
- ✅ La configuración es **100% por variables de entorno**

## 📚 Documentación Adicional

- [Documentación Técnica](backend/docs/RATE_LIMITING.md)
- [Changelog de Cambios](CHANGELOG_RATE_LIMITING.md)
- [Tests Unitarios](backend/test/unit-tests/test_rate_limiter.py)
