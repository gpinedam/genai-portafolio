# API Contract — GenAI Portafolio

Contrato completo de la API REST del backend. Base URL: `http://localhost:8000`

---

## Endpoints

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/health` | Estado del servicio | No |
| `POST` | `/api/v1/chat` | Chat bloqueante | No |
| `POST` | `/api/v1/chat/stream` | Chat con streaming SSE | No |
| `GET` | `/api/v1/contacts` | Contactos guardados en CSV | No |

---

## GET `/api/v1/health`

Verifica que el servidor esté activo.

### Request
```
GET /api/v1/health
```

### Response `200 OK`
```json
{
  "status": "ok"
}
```

### Ejemplo
```bash
curl http://localhost:8000/api/v1/health
```

---

## POST `/api/v1/chat`

Envía un mensaje al agente conversacional. La respuesta es **bloqueante** — espera a que el LLM genere la respuesta completa.

### Request
```
POST /api/v1/chat
Content-Type: application/json
```

```json
{
  "message": "string (requerido) — mensaje del usuario",
  "session_id": "string (opcional) — ID de sesión para continuar conversación"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `message` | `string` | ✅ | Texto del mensaje. No puede estar vacío. |
| `session_id` | `string` | ❌ | Si se omite o envía vacío, se genera uno nuevo automáticamente. |

### Response `200 OK`
```json
{
  "reply": "string — respuesta del asistente (Markdown)",
  "session_id": "string — ID de sesión (nuevo o el enviado)",
  "remaining_questions": "integer — preguntas restantes para esta IP"
}
```

### Response `400 Bad Request` — mensaje vacío
```json
{
  "error": "message is required"
}
```

### Response `429 Too Many Requests` — rate limit alcanzado
```json
{
  "error": "Has alcanzado el límite de 8 preguntas. Por favor espera 1h 45m para poder continuar.",
  "remaining_questions": 0,
  "rate_limited": true
}
```

### Ejemplo
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "¿Cuál es la experiencia laboral de George?",
    "session_id": ""
  }'
```

```json
{
  "reply": "George tiene experiencia en:\n- **G&S** (Jul 2025–presente): Analista Programador...",
  "session_id": "a3f9c1b2d4e567890abc",
  "remaining_questions": 7
}
```

---

## POST `/api/v1/chat/stream`

Envía un mensaje al agente con respuesta en **streaming via Server-Sent Events (SSE)**. El cliente recibe tokens del LLM a medida que se generan.

### Request
```
POST /api/v1/chat/stream
Content-Type: application/json
```

```json
{
  "message": "string (requerido)",
  "session_id": "string (opcional)"
}
```

### Response `200 OK` — `text/event-stream`

La respuesta es un stream de eventos SSE. Cada línea tiene el formato:

```
data: <JSON>\n\n
```

#### Evento `session` (primer evento)
```json
{
  "type": "session",
  "session_id": "string — ID de sesión asignado",
  "remaining_questions": "integer"
}
```

#### Evento `chunk` (por cada token generado)
```json
{
  "type": "chunk",
  "content": "string — fragmento de texto del LLM"
}
```

#### Evento `error` (si ocurre un error durante la generación)
```json
{
  "type": "error",
  "content": "string — descripción del error"
}
```

#### Evento `done` (último evento, indica fin del stream)
```json
{
  "type": "done"
}
```

#### Cabeceras de respuesta
```
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

### Response `400 Bad Request`
```json
{
  "error": "message is required"
}
```

### Response `429 Too Many Requests`
```json
{
  "error": "Has alcanzado el límite de 8 preguntas...",
  "remaining_questions": 0,
  "rate_limited": true
}
```

### Ejemplo (curl)
```bash
curl -N -X POST http://localhost:8000/api/v1/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hola, ¿quién eres?", "session_id": ""}'
```

Salida esperada:
```
data: {"type": "session", "session_id": "abc123", "remaining_questions": 8}

data: {"type": "chunk", "content": "Hola"}

data: {"type": "chunk", "content": ", soy"}

data: {"type": "chunk", "content": " el asistente de George..."}

data: {"type": "done"}
```

### Ejemplo (JavaScript)
```javascript
const response = await fetch('/api/v1/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hola', session_id: sessionId })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const lines = decoder.decode(value).split('\n');
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const event = JSON.parse(line.slice(6));

    if (event.type === 'session') {
      sessionId = event.session_id;
    } else if (event.type === 'chunk') {
      // Agregar token al mensaje en pantalla
    } else if (event.type === 'done') {
      // Finalizar
    }
  }
}
```

---

## GET `/api/v1/contacts`

Devuelve los contactos guardados en `storage/info-table-genai.csv`.

> **Nota:** Este endpoint requiere que la herramienta `csv_tool` del agente esté habilitada (`TOOLS_ENABLED=True`) para que existan contactos. Por defecto las herramientas están deshabilitadas.

### Request
```
GET /api/v1/contacts
```

### Response `200 OK`
```json
{
  "contacts": [
    {
      "nombres": "string",
      "apellidos": "string",
      "correo": "string",
      "telefono": "string"
    }
  ]
}
```

Si no hay contactos o el archivo no existe:
```json
{
  "contacts": []
}
```

### Response `500 Internal Server Error` — error al leer el CSV
```json
{
  "error": "string — descripción del error"
}
```

### Ejemplo
```bash
curl http://localhost:8000/api/v1/contacts
```

---

## Rate Limiting

Todos los endpoints de `/chat` aplican rate limiting por IP.

| Parámetro | Env Var | Default |
|---|---|---|
| Máximo de preguntas | `MAX_QUESTIONS_PER_USER` | `8` |
| Ventana de tiempo | `RATE_LIMIT_WINDOW_HOURS` | `2 horas` |

### Identificación del cliente
1. Cabecera `X-Forwarded-For` (primer IP en caso de cadena de proxies)
2. `request.remote_addr` si no hay cabecera

### Comportamiento
- El contador se incrementa **antes** de procesar la solicitud.
- Al superar el límite: `HTTP 429` con tiempo de espera restante en el mensaje de error.
- El contador se resetea automáticamente al cumplirse la ventana de tiempo.
- El estado es **in-memory** — se pierde al reiniciar el servidor.

### Campo `remaining_questions`
Todos los endpoints de chat incluyen `remaining_questions` en la respuesta para que el cliente pueda informar al usuario cuántas preguntas le quedan.

---

## Manejo de Sesiones

- Las sesiones se identifican por `session_id` (string hexadecimal de 32 caracteres).
- Si no se provee `session_id` (o se envía vacío), se genera uno nuevo con `uuid4().hex`.
- Cada sesión tiene su propio `LangChainOrchestrator` con historial de mensajes independiente.
- Las sesiones son **in-memory** — no persisten entre reinicios del servidor.
- No hay endpoint para eliminar o listar sesiones.

---

## Códigos de Estado HTTP

| Código | Descripción |
|---|---|
| `200` | Éxito |
| `400` | Bad Request — `message` vacío o ausente |
| `404` | Not Found — ruta no reconocida |
| `429` | Too Many Requests — rate limit alcanzado |
| `500` | Internal Server Error — error al leer CSV u otro error interno |
