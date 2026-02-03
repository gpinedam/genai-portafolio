# 🚀 Quick Start - Rate Limiting

## Configuración Rápida (2 minutos)

### 1. Configurar variables de entorno
```bash
cd backend
cp .env-example .env
nano .env  # o usa tu editor favorito
```

Asegúrate de que existan estas líneas:
```bash
MAX_QUESTIONS_PER_USER=8
RATE_LIMIT_WINDOW_HOURS=2
```

### 2. Iniciar el servidor
```bash
# Desde la raíz del proyecto
./run_local.sh
```

### 3. Probar en el navegador
```
http://localhost:8000
```

¡Listo! El sistema está funcionando. Verás el contador de preguntas en el chat.

---

## 🧪 Verificación Rápida

```bash
# Ejecutar tests
cd backend
source .venv/bin/activate
python -m pytest test/unit-tests/test_rate_limiter.py -v

# Deberías ver:
# ✅ 5 tests passed
```

---

## 📊 ¿Cómo funciona?

1. Usuario entra al chat → Tiene 8 preguntas disponibles
2. Hace preguntas → El contador disminuye con cada una
3. Llega a 8 preguntas → Se bloquea por 2 horas
4. Después de 2 horas → El contador se resetea automáticamente

---

## ⚙️ Personalización

### Cambiar el límite de preguntas

En `backend/.env`:
```bash
MAX_QUESTIONS_PER_USER=15  # Ahora son 15 preguntas
```

### Cambiar tiempo de bloqueo

En `backend/.env`:
```bash
RATE_LIMIT_WINDOW_HOURS=1  # Bloqueo de 1 hora
```

**Importante**: Reinicia el servidor después de cambiar configuración.

---

## 📚 Más Información

- [Guía Completa](GUIA_RATE_LIMITING.md)
- [Documentación Técnica](RATE_LIMITING.md)
- [Changelog](CHANGELOG_RATE_LIMITING.md)
- [Resumen Visual](RESUMEN_VISUAL.md)

---

## 🐛 Problemas Comunes

### El contador no aparece
- Limpia caché del navegador (Ctrl/Cmd + Shift + R)
- Verifica que el servidor esté corriendo

### El límite no funciona
- Verifica que `.env` tenga las variables
- Reinicia el servidor
- Verifica que `.env` esté en `/backend/`

---

## ✅ Checklist de Instalación

- [ ] Archivo `.env` configurado
- [ ] Variables `MAX_QUESTIONS_PER_USER` y `RATE_LIMIT_WINDOW_HOURS` establecidas
- [ ] Servidor ejecutándose en `http://localhost:8000`
- [ ] Contador visible en el chat
- [ ] Tests ejecutados exitosamente

---

¡Todo listo! 🎉
