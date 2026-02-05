# Guía para Crear Nuevos Proyectos

Esta guía explica cómo agregar nuevos proyectos al portafolio de GenAI.

## 📁 Estructura de Archivos

Los proyectos se componen de dos elementos:

1. **Archivo Markdown** (`proyecto-X.md`) en `frontend/content/projects/`
2. **Entrada en el registro** (`projects-list.json`) en `frontend/content/projects/`

---

## 🚀 Paso 1: Crear el Archivo Markdown del Proyecto

Crea un nuevo archivo en `frontend/content/projects/` con el nombre `proyecto-X.md` (donde X es el número siguiente disponible).

### Estructura del Archivo

```markdown
# Título del Proyecto (Categoría)

## Descripción
Breve descripción del proyecto destacando el problema que resuelve y los resultados obtenidos. 
Incluye métricas de impacto si están disponibles (ej: "reducción del 95%").

## Tecnologías Utilizadas
- Tecnología 1
- Tecnología 2
- Tecnología 3
- Framework/Servicio 1
- Framework/Servicio 2

## Impacto
- ✅ Resultado/beneficio 1
- ✅ Resultado/beneficio 2
- ✅ Resultado/beneficio 3
- ✅ Resultado/beneficio 4

## Rol
Descripción de tu rol específico en el proyecto, responsabilidades y contribuciones principales.
```

### Ejemplo Completo

```markdown
# Sistema de Análisis de Sentimientos (Marketing)

## Descripción
Plataforma de análisis automático de opiniones de clientes en redes sociales, logrando 
procesar más de **10,000 comentarios diarios** con una precisión del 92%.

## Tecnologías Utilizadas
- Azure Cognitive Services
- Python
- FastAPI
- React
- MongoDB

## Impacto
- ✅ Procesamiento de 10K+ comentarios diarios
- ✅ Precisión del 92% en clasificación
- ✅ Reducción de 80% en tiempo de análisis
- ✅ Dashboard en tiempo real para toma de decisiones

## Rol
Desarrollo del backend con FastAPI, integración con Azure Cognitive Services, 
y diseño de la arquitectura de microservicios.
```

---

## 📝 Paso 2: Registrar el Proyecto en `projects-list.json`

Abre el archivo `frontend/content/projects/projects-list.json` y agrega una nueva entrada en el array `projects`.

### Estructura de la Entrada JSON

```json
{
  "id": "proyecto-X",
  "title": "Título del Proyecto",
  "category": "Categoría",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "image": "/assets/pjX.jpg",
  "file": "proyecto-X.md",
  "type": "sin-demo",
  "implementation": "mvp",
  "demoUrl": "https://www.youtube.com/embed/VIDEO_ID",
  "featured": false
}
```

### Descripción de los Campos

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `id` | string | Identificador único del proyecto | `"proyecto-1"`, `"proyecto-2"`, etc. |
| `title` | string | Título descriptivo del proyecto | Cualquier texto |
| `category` | string | Categoría del proyecto | `"Banca"`, `"Finanzas"`, `"Salud"`, `"Agricultura"`, `"Marketing"`, etc. |
| `tags` | array | Lista de tecnologías/temas clave | `["IA Generativa", "Azure", "Python"]` |
| `image` | string | Ruta a la imagen del proyecto | `"/assets/pj1.jpg"` |
| `file` | string | Nombre del archivo markdown | `"proyecto-X.md"` |
| `type` | string | Tipo de demo disponible | `"sin-demo"` o `"con-demo"` |
| `implementation` | string | Nivel de implementación | `"demo"`, `"poc"`, `"mvp"`, `"enterprise"` |
| `demoUrl` | string | URL del video demo (opcional) | URL de YouTube embed |
| `featured` | boolean | Si se destaca en la página principal | `true` o `false` |

### Niveles de Implementación

- **`demo`**: Demostración de concepto
- **`poc`**: Proof of Concept (Prueba de Concepto)
- **`mvp`**: Minimum Viable Product (Producto Mínimo Viable)
- **`enterprise`**: Implementación empresarial completa

### Ejemplo Completo

```json
{
  "id": "proyecto-7",
  "title": "Sistema de Análisis de Sentimientos",
  "category": "Marketing",
  "tags": ["Azure Cognitive", "NLP", "FastAPI"],
  "image": "/assets/pj7.jpg",
  "file": "proyecto-7.md",
  "type": "con-demo",
  "implementation": "mvp",
  "demoUrl": "https://www.youtube.com/embed/abc123xyz",
  "featured": true
}
```

---

## 🖼️ Paso 3: Agregar Imagen del Proyecto

1. Agrega la imagen del proyecto en `frontend/assets/` con el nombre `pjX.jpg` (donde X es el número del proyecto)
2. Asegúrate de que la ruta en `projects-list.json` coincida: `"/assets/pjX.jpg"`

### Recomendaciones para Imágenes

- **Formato**: JPG o PNG
- **Dimensiones recomendadas**: 1200x800px o superior
- **Peso**: Optimizar para web (< 500KB)
- **Contenido**: Captura de pantalla, diagrama de arquitectura, o imagen representativa

---

## ✅ Checklist de Verificación

Antes de considerar completado el nuevo proyecto, verifica:

- [ ] Archivo `proyecto-X.md` creado en `frontend/content/projects/`
- [ ] Estructura markdown completa (Descripción, Tecnologías, Impacto, Rol)
- [ ] Entrada agregada en `projects-list.json`
- [ ] Todos los campos JSON completados correctamente
- [ ] ID único asignado (`proyecto-X`)
- [ ] Imagen del proyecto agregada en `frontend/assets/`
- [ ] Ruta de imagen correcta en JSON
- [ ] Tags relevantes incluidos
- [ ] Nivel de implementación apropiado
- [ ] `featured` configurado según corresponda

---

## 🔄 Orden de los Proyectos

Los proyectos aparecen en la página en el orden en que están listados en `projects-list.json`. Para cambiar el orden:

1. Mueve las entradas dentro del array `projects`
2. Los proyectos con `"featured": true` pueden tener prioridad visual

---

## 💡 Consejos y Mejores Prácticas

### Para la Descripción
- Sé conciso pero informativo (2-3 líneas)
- Incluye métricas de impacto cuando sea posible
- Destaca el valor de negocio o problema resuelto

### Para las Tecnologías
- Lista las tecnologías principales primero
- Incluye entre 4-6 tecnologías relevantes
- Menciona clouds específicos (Azure, AWS, GCP)

### Para el Impacto
- Usa puntos con ✅ para mejor legibilidad
- Incluye 4-5 puntos clave
- Prioriza resultados medibles

### Para los Tags
- Máximo 3-4 tags por proyecto
- Usa términos consistentes con otros proyectos
- Prioriza las tecnologías más relevantes

---

## 🎯 Ejemplos de Categorías Comunes

- **Banca**: Proyectos para instituciones financieras
- **Finanzas**: Soluciones financieras generales
- **Salud**: Healthcare y aplicaciones médicas
- **Agricultura**: AgTech y soluciones agrícolas
- **Marketing**: Análisis de mercado y campañas
- **E-commerce**: Comercio electrónico
- **Educación**: EdTech y plataformas de aprendizaje
- **Logística**: Supply chain y distribución

---

## 🔍 Solución de Problemas

### El proyecto no aparece en la página
- Verifica que el JSON esté bien formado (sin errores de sintaxis)
- Confirma que el nombre del archivo `.md` coincida con el campo `file`
- Revisa la consola del navegador para errores

### La imagen no se muestra
- Verifica que la ruta sea exacta: `"/assets/pjX.jpg"`
- Confirma que la imagen exista en `frontend/assets/`
- Revisa el nombre del archivo (sensible a mayúsculas/minúsculas)

### Errores de JSON
- Usa un validador JSON online
- Verifica que todas las comas estén en su lugar
- Asegúrate de que el último elemento no tenga coma final

---

## 📚 Recursos Adicionales

- [Markdown Guide](https://www.markdownguide.org/)
- [JSON Validator](https://jsonlint.com/)
- Ver proyectos existentes como referencia en `frontend/content/projects/`

---

**¿Necesitas ayuda?** Revisa los proyectos existentes en el directorio como ejemplos de referencia.
