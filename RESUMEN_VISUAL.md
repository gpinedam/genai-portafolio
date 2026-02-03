# Sistema de Rate Limiting - Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DEL SISTEMA                        │
└─────────────────────────────────────────────────────────────┘

Usuario                Frontend               Backend              RateLimiter
   │                      │                      │                      │
   │  1. Envía pregunta   │                      │                      │
   ├─────────────────────>│                      │                      │
   │                      │  2. POST /chat       │                      │
   │                      ├─────────────────────>│                      │
   │                      │                      │  3. check_limit(IP)  │
   │                      │                      ├─────────────────────>│
   │                      │                      │                      │
   │                      │                      │  4. can_proceed?     │
   │                      │                      │<─────────────────────┤
   │                      │                      │                      │
   │                      │  ┌─────────────────┐ │                      │
   │                      │  │  SI: Continúa   │ │                      │
   │                      │  │  NO: HTTP 429   │ │                      │
   │                      │  └─────────────────┘ │                      │
   │                      │                      │                      │
   │                      │  5. Response + count │                      │
   │                      │<─────────────────────┤                      │
   │  6. Muestra respuesta│                      │                      │
   │<─────────────────────┤                      │                      │
   │  + contador visual   │                      │                      │
   │                      │                      │                      │


┌─────────────────────────────────────────────────────────────┐
│               ESTADOS DEL CONTADOR                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│ 📊 Preguntas restantes: 8│  ← Estado inicial (Verde)
└──────────────────────────┘

┌──────────────────────────┐
│ 📊 Preguntas restantes: 5│  ← Normal (Verde)
└──────────────────────────┘

┌──────────────────────────┐
│ 📊 Preguntas restantes: 3│  ← Advertencia (Naranja)
└──────────────────────────┘

┌──────────────────────────┐
│ 📊 Preguntas restantes: 1│  ← Crítico (Rojo)
└──────────────────────────┘

┌──────────────────────────────────────────────┐
│ ⚠️ Chat bloqueado. Espera el tiempo indicado │  ← Bloqueado (Rojo)
└──────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│              LÍNEA DE TIEMPO DE EJEMPLO                     │
└─────────────────────────────────────────────────────────────┘

10:00 ─► Pregunta 1  │ Contador: 7/8 restantes │ Resetea: 12:00
10:05 ─► Pregunta 2  │ Contador: 6/8 restantes │ Resetea: 12:00
10:10 ─► Pregunta 3  │ Contador: 5/8 restantes │ Resetea: 12:00
10:15 ─► Pregunta 4  │ Contador: 4/8 restantes │ Resetea: 12:00
10:20 ─► Pregunta 5  │ Contador: 3/8 restantes │ Resetea: 12:00 ⚠️
10:25 ─► Pregunta 6  │ Contador: 2/8 restantes │ Resetea: 12:00 ⚠️
10:30 ─► Pregunta 7  │ Contador: 1/8 restantes │ Resetea: 12:00 🚨
10:35 ─► Pregunta 8  │ Contador: 0/8 restantes │ Resetea: 12:00 🚨
10:40 ─► Pregunta 9  │ ❌ BLOQUEADO - Espera hasta 12:00
11:00 ─► Pregunta 10 │ ❌ BLOQUEADO - Espera hasta 12:00
12:00 ─► ✅ Contador RESETEADO - Puede hacer 8 preguntas nuevamente
12:01 ─► Pregunta 1  │ Contador: 7/8 restantes │ Resetea: 14:01


┌─────────────────────────────────────────────────────────────┐
│                 ESTRUCTURA DE ARCHIVOS                      │
└─────────────────────────────────────────────────────────────┘

backend/
├── app/
│   ├── core/
│   │   └── rate_limiter.py         ← 🆕 Lógica de limitación
│   ├── config/
│   │   └── base.py                 ← ✏️ Nuevas variables
│   └── api/
│       └── v1/
│           └── routes.py            ← ✏️ Validación integrada
├── test/
│   └── unit-tests/
│       ├── test_rate_limiter.py    ← 🆕 Tests (5 tests ✅)
│       └── conftest.py             ← ✏️ Fix de imports
├── docs/
│   └── RATE_LIMITING.md            ← 🆕 Documentación técnica
└── .env-example                     ← ✏️ Nuevas variables

frontend/
├── app.js                           ← ✏️ Lógica de contador
├── index.html                       ← ✏️ Elemento contador
└── styles.css                       ← ✏️ Estilos contador

raíz/
├── README.md                        ← ✏️ Actualizado
├── GUIA_RATE_LIMITING.md           ← 🆕 Guía de uso
├── CHANGELOG_RATE_LIMITING.md      ← 🆕 Resumen de cambios
└── test_rate_limiting.sh           ← 🆕 Script de pruebas


┌─────────────────────────────────────────────────────────────┐
│              RESPUESTAS DE LA API                           │
└─────────────────────────────────────────────────────────────┘

✅ Pregunta Exitosa (HTTP 200)
┌────────────────────────────────────┐
│ {                                  │
│   "reply": "...",                  │
│   "session_id": "abc123",          │
│   "remaining_questions": 5         │
│ }                                  │
└────────────────────────────────────┘

❌ Límite Alcanzado (HTTP 429)
┌────────────────────────────────────────────────────┐
│ {                                                  │
│   "error": "Has alcanzado el límite de 8 ...",   │
│   "remaining_questions": 0,                        │
│   "rate_limited": true                             │
│ }                                                  │
└────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│              VARIABLES DE ENTORNO                           │
└─────────────────────────────────────────────────────────────┘

# En backend/.env

MAX_QUESTIONS_PER_USER=8      ← Número máximo de preguntas
RATE_LIMIT_WINDOW_HOURS=2     ← Horas de espera tras límite


┌─────────────────────────────────────────────────────────────┐
│                   COMANDOS ÚTILES                           │
└─────────────────────────────────────────────────────────────┘

# Ejecutar tests
cd backend && source .venv/bin/activate
python -m pytest test/unit-tests/test_rate_limiter.py -v

# Ejecutar servidor
./run_local.sh

# Probar rate limiting
./test_rate_limiting.sh

# Ver configuración actual
cat backend/.env | grep MAX_QUESTIONS


┌─────────────────────────────────────────────────────────────┐
│                 CHECKLIST DE IMPLEMENTACIÓN                 │
└─────────────────────────────────────────────────────────────┘

Backend:
  ✅ Clase RateLimiter creada
  ✅ Configuración con variables de entorno
  ✅ Integración en endpoint /chat
  ✅ Manejo de IP con X-Forwarded-For
  ✅ Respuesta HTTP 429 para bloqueos
  ✅ Tests unitarios (5 tests)

Frontend:
  ✅ Contador visual implementado
  ✅ Manejo de HTTP 429
  ✅ Código de colores (verde/naranja/rojo)
  ✅ Deshabilitación de input al bloquear
  ✅ Actualización en tiempo real

Documentación:
  ✅ README.md actualizado
  ✅ .env-example actualizado
  ✅ Documentación técnica
  ✅ Guía de uso
  ✅ Changelog de cambios
  ✅ Script de pruebas

Testing:
  ✅ Tests unitarios funcionando
  ✅ Script de pruebas manual
  ✅ Sin errores de compilación


┌─────────────────────────────────────────────────────────────┐
│                    ¡IMPLEMENTACIÓN COMPLETA!                │
└─────────────────────────────────────────────────────────────┘
```
