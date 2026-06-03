# 📖 Manual de uso de `Mente/` para agentes IA

**Repo:** `/home/brianweb3/for3s/marca-personal/`
**Audiencia:** Claude (Claude Code, claude.ai), Codex (OpenAI), GPT, cualquier agente IA que entre al repo.
**Owner:** Brian López
**Última actualización:** 2026-06-03
**Estatus:** Activo · LEER ANTES DE TOCAR `Mente/`

---

## 🎯 Para qué existe este manual

Este documento le dice a cualquier agente IA (Claude, Codex, GPT, futuros) **cómo operar la estructura `Mente/`** del repo `marca-personal/`:

- **Cuándo** escribir en cada capa
- **Cómo** estructurar lo que escribas
- **Qué** preguntar antes de tocar
- **Cuándo** actualizar `Estado_Sesion_Continuidad.md`
- **Cómo** coexistir con el skill `impeccable` ya instalado
- **Qué evitar** para no romper la disciplina del sistema

Sin este manual, los agentes inventan estructura, mezclan capas, sobreescriben contexto. Con este manual, cualquier agente entra en frío y opera con la misma disciplina.

---

## 1. Primero, las 3 verdades que NUNCA cambian

```
   ╔═══════════════════════════════════════════════════════════╗
   ║                                                            ║
   ║   VERDAD 1: Mente/ es local del SITIO                      ║
   ║   ────────────────────────────────────                      ║
   ║   Esta Mente/ gobierna marca-personal/ (el sitio público). ║
   ║   NO gobierna For3s OS plataforma — eso vive en            ║
   ║   /home/brianweb3/for3s/Mente/ (Mente principal).          ║
   ║                                                            ║
   ║                                                            ║
   ║   VERDAD 2: Mente/ y skill impeccable COEXISTEN             ║
   ║   ────────────────────────────────────────────              ║
   ║   La skill (.claude/skills/impeccable/) sigue siendo dueña ║
   ║   de tareas de diseño/UI y consume PRODUCT.md + DESIGN.md  ║
   ║   en raíz. Mente/ NO los reemplaza. Mente/ PRECEDE al      ║
   ║   skill en el flujo del agente (lees Mente/ primero,        ║
   ║   ejecutas skill después).                                  ║
   ║                                                            ║
   ║                                                            ║
   ║   VERDAD 3: Mente/ es APPEND-MOSTLY                         ║
   ║   ─────────────────────────────────                         ║
   ║   No reescribes documentos existentes. Agregas notas.       ║
   ║   Si una regla cambia, marcas la vieja como obsoleta y      ║
   ║   referencias la nueva. La historia se preserva.            ║
   ║                                                            ║
   ╚═══════════════════════════════════════════════════════════╝
```

---

## 2. Diagrama: cómo entra un agente al repo

```
   ┌────────────────────────────────────────────────────────────┐
   │  AGENTE NUEVO ENTRA AL REPO marca-personal/                 │
   └────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  PASO 1: Lee CLAUDE.md → AGENTS.md (existentes, raíz)       │
   │          Aprende: "Next 16 cambió APIs vs training data"    │
   └────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  PASO 2: Lee Mente/Doc/README.md                            │
   │          Aprende: estructura 4 capas + protocolo            │
   └────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  PASO 3: Lee Mente/Doc/Estado_Sesion_Continuidad.md         │
   │          Aprende: estado actual, AUDIT pendiente, reglas    │
   └────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  PASO 4: Lee Mente/MANUAL_USO_IA.md (este archivo)          │
   │          Aprende: cómo escribir en Mente/ sin romper        │
   └────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  PASO 4.5: Si la tarea toca UI/UX/diseño, lee               │
   │            Mente/Doc/Impeccable_Workflow.md                 │
   │            Aprende: preflight, comandos, verificación bun   │
   └────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  PASO 5: Clasifica la tarea (ver §3 de este manual)         │
   └────────────────────────────────────────────────────────────┘
              │                    │                    │
              ▼                    ▼                    ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ Tarea diseño/UI  │  │ Tarea código/    │  │ Tarea pensamiento│
   │ → ejecuta skill  │  │ refactor         │  │ → escribe en      │
   │   impeccable     │  │ → modifica       │  │   Mente/(capa)    │
   │   (lee PRODUCT/  │  │   app, components│  │   correspondiente │
   │   DESIGN)        │  │   con permiso    │  │                   │
   └──────────────────┘  └──────────────────┘  └──────────────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   ▼
   ┌────────────────────────────────────────────────────────────┐
   │  PASO 6: Si algo cambió que afecte estado → actualiza        │
   │          Estado_Sesion_Continuidad.md §11 Bitácora           │
   └────────────────────────────────────────────────────────────┘
```

---

## 3. Cómo clasificar tu tarea (árbol de decisión)

Antes de escribir nada en `Mente/`, clasifica qué te pidieron:

```
   ¿La tarea modifica código del sitio?
   │
   ├── SÍ ─► ¿Es diseño/UI/UX/visual?
   │         │
   │         ├── SÍ ─► Ejecuta skill impeccable.
   │         │         (Lee PRODUCT.md + DESIGN.md primero)
   │         │         (Lee Mente/Doc/Impeccable_Workflow.md)
   │         │         Declara IMPECCABLE_PREFLIGHT antes de editar.
   │         │         Si descubres patrón importante para futuro,
   │         │         documéntalo en Mente/Cerebro/.
   │         │
   │         └── NO ─► ¿Es refactor estructural o feature nueva?
   │                   │
   │                   ├── SÍ ─► Antes de tocar código, plan en
   │                   │         Mente/Cuerpo/. Confirma con Brian.
   │                   │         Después de aplicar, documenta en
   │                   │         Bitácora del Estado_Sesion.
   │                   │
   │                   └── NO ─► Es bugfix/típo/cosa menor. Hazlo,
   │                              documenta en Estado_Sesion §11 si
   │                              afecta estado real del sitio.
   │
   └── NO ─► ¿La tarea es análisis/investigación/pensamiento?
             │
             ├── ¿Es convicción o intuición sobre el sitio?
             │   → Escribe en Mente/Alma/
             │
             ├── ¿Es análisis técnico / UX / audiencia / pattern?
             │   → Escribe en Mente/Cerebro/
             │
             ├── ¿Es plan de construcción o refactor propuesto?
             │   → Escribe en Mente/Cuerpo/
             │
             └── ¿Cruza varias capas / es meta-gobierno?
                 → Escribe en Mente/Doc/
```

---

## 4. Cuándo escribir en cada capa (con ejemplos concretos)

### 4.1 `Mente/Alma/` — Convicciones del sitio

**Escribe aquí cuando:**
- Brian expresa una convicción sobre el sitio que no estaba escrita ("nunca voy a permitir X")
- Descubres una decisión estratégica implícita que merece ser explícita
- Identificas una intuición cruda que aún no se puede racionalizar pero importa
- Articulas el "por qué" detrás de algo que ya está hecho

**Ejemplos de archivos válidos en Alma/:**

```
   ✅ dual_mode_es_estrategia.md
      Por qué Light/Dark NO es preferencia visual sino
      posicionamiento estratégico de mercado.
   
   ✅ por_que_no_personificamos.md
      Por qué el sitio NO tiene mascota ni voz "amigo simpático"
      a diferencia de Godinez.AI.
   
   ✅ latam_sin_disculpas.md
      Manifiesto corto sobre por qué operamos desde LATAM
      como centro, no como excusa.
   
   ❌ analisis_competencia.md
      ESTO NO va en Alma. Va en Cerebro/.
   
   ❌ plan_refactor_hero.md
      ESTO NO va en Alma. Va en Cuerpo/.
```

**Template Alma/:**

```markdown
# [Nombre de la convicción]

**Capa:** Alma — convicción no-negociable del sitio
**Fecha:** YYYY-MM-DD
**Autor:** Brian López + [agente]
**Estado:** Activa | Obsoleta (referencia: [nuevo doc])

## La convicción en una frase

[Una frase clara y rotunda.]

## Por qué importa

[Por qué no se negocia. Qué pasaría si la rompemos.]

## Cómo se manifiesta en el sitio

[Ejemplos concretos de cómo esta convicción aparece en código/copy/diseño.]

## Anti-señales

[Qué cosas indicarían que estamos traicionando esta convicción.]
```

### 4.2 `Mente/Cerebro/` — Análisis y modelos mentales

**Escribe aquí cuando:**
- Terminas una sesión de investigación de competencia
- Analizas un patrón de UX/conversión
- Profundizas en una audiencia más allá de lo que dice PRODUCT.md
- Estudias una API nueva de Next.js 16 y aprendes algo útil
- Mapeas el embudo de conversión observado
- Documentas un modelo mental sobre cómo funciona algo

**Ejemplos de archivos válidos en Cerebro/:**

```
   ✅ audiencias_extendidas.md
      Profundización de los 4 contextos de PRODUCT.md con
      subsegmentos descubiertos en interacciones reales.
   
   ✅ nextjs_16_breaking_changes.md
      Lista de APIs que cambiaron vs Next 15 con ejemplos
      de uso correcto. Útil para evitar errores futuros.
   
   ✅ analisis_portfolios_founders_latam.md
      Análisis comparado de 10 portafolios de founders LATAM.
      Qué patrones reflejan vs anti-patrones.
   
   ✅ funnel_b2b_observado.md
      Modelo mental del embudo B2B Light desde entrada hasta
      conversación agendada. Donde se pierden visitantes.
   
   ❌ refactor_proyectos_section.md
      ESTO NO va en Cerebro. Va en Cuerpo/ (es plan ejecutable).
   
   ❌ no_marketing_language.md
      ESTO NO va en Cerebro. Va en Alma (es convicción) o
      sigue en PRODUCT.md donde ya está.
```

**Template Cerebro/:**

```markdown
# [Tema del análisis]

**Capa:** Cerebro — análisis, modelo mental, mapa conceptual
**Fecha:** YYYY-MM-DD
**Autor:** Brian López + [agente]
**Categoría:** Audiencia | UX | Técnica | Competencia | Patrón

## TL;DR

[2-3 líneas con la conclusión central.]

## Contexto

[Por qué hicimos este análisis. Qué pregunta intenta responder.]

## Hallazgos

[Cuerpo del análisis. Diagramas ASCII bienvenidos.]

## Implicaciones para el sitio

[Qué deberíamos hacer (o evitar) basados en esto.]

## Conexiones con otros docs

[Links a Alma/, Cuerpo/, AUDIT.md, PRODUCT.md, etc.]

## Próximos pasos sugeridos

[Si esto se vuelve plan, en qué carpeta vivirá.]
```

### 4.3 `Mente/Cuerpo/` — Planes técnicos del sitio

**Escribe aquí cuando:**
- Brian aprueba un refactor o feature nueva
- Tienes un análisis de Cerebro/ listo para volverse plan
- Diseñas un experimento (A/B test, variante visual)
- Propones un plan de migración o upgrade técnico
- Quieres dejar bitácora detallada de un cambio importante antes de aplicarlo

**Ejemplos de archivos válidos en Cuerpo/:**

```
   ✅ plan_seccion_docs_v2.md
      Refactor completo de la sección Docs: arquitectura
      propuesta, archivos a tocar, riesgos, checklist.
   
   ✅ roadmap_i18n_idiomas_nuevos.md
      Plan técnico para agregar pt-BR y fr al sitio.
      Pasos, archivos a modificar, dependencias.
   
   ✅ experimento_hero_variants.md
      Diseño de 3 variantes de Hero para A/B test.
      Hipótesis, métricas, plan de rollout.
   
   ✅ migracion_tailwind_v4_lessons.md
      Bitácora de cuando migramos a Tailwind v4.
      Qué rompió, cómo lo arreglamos.
   
   ❌ ejecuto_skill_impeccable_craft_hero.md
      ESTO NO va en Cuerpo. Ejecuciones del skill quedan
      registradas en commit messages, no en docs.
   
   ❌ ideas_sueltas_features.md
      ESTO NO va en Cuerpo. Si son ideas crudas, van a
      Alma/ o backlog separado. Cuerpo es plan estructurado.
```

**Template Cuerpo/:**

```markdown
# [Nombre del plan/experimento/bitácora]

**Capa:** Cuerpo — plan técnico ejecutable
**Fecha:** YYYY-MM-DD
**Autor:** Brian López + [agente]
**Tipo:** Plan refactor | Feature nueva | Experimento | Bitácora
**Estatus:** Borrador | Aprobado | En ejecución | Aplicado | Cancelado

## Objetivo

[Qué resuelve este plan en una frase.]

## Contexto previo

[Qué motivó esto. Links a Cerebro/ o AUDIT.md.]

## Decisión propuesta

[La solución elegida.]

## Alternativas consideradas

[Otras opciones evaluadas y por qué no se eligieron.]

## Archivos a tocar

- `app/[locale]/page.tsx` — qué cambia
- `components/sections/X.tsx` — qué cambia
- `messages/{es,en}.json` — qué keys agrega/modifica

## Riesgos

[Qué puede romperse. Cómo mitigar.]

## Checklist de ejecución

- [ ] Confirmar plan con Brian
- [ ] Crear branch
- [ ] Aplicar cambios archivo por archivo
- [ ] Correr `bun run build`
- [ ] Correr skill impeccable audit
- [ ] Actualizar AUDIT.md si corresponde
- [ ] Actualizar Estado_Sesion §11 Bitácora
- [ ] PR + review

## Métricas de éxito

[Cómo sabremos si funcionó.]

## Resultado (llenar al terminar)

[Qué pasó realmente. Sorpresas. Aprendizajes para Cerebro/.]
```

### 4.4 `Mente/Doc/` — Gobierno y continuidad

**Escribe aquí cuando:**
- Cambia una regla de gobierno de la propia Mente/
- Agregas un nuevo tipo de documento que no cabe en las 3 capas
- Necesitas actualizar el índice maestro
- Necesitas actualizar Estado_Sesion_Continuidad
- Documentas algo que cruza Alma + Cerebro + Cuerpo y separarlo lo rompería

**Archivos canónicos de Doc/ (NO crear otros sin permiso):**

- `README.md` — índice maestro (modificar §5 al agregar docs en otras capas)
- `Estado_Sesion_Continuidad.md` — actualizar §11 con bitácora de cambios importantes
- `Impeccable_Workflow.md` — protocolo obligatorio para tareas UI/UX/diseño con `impeccable`

**Cuándo actualizar `Estado_Sesion_Continuidad.md` (CRÍTICO):**

```
   ✅ SÍ ACTUALIZAR cuando:
      • Aplicas un cambio importante al sitio (refactor, feature)
      • Se modifica el stack (upgrade Next, nueva dependencia)
      • Se cierra un finding de AUDIT.md
      • Se genera un nuevo AUDIT.md
      • Brian confirma una decisión de las "preguntas pendientes"
      • Se modifica PRODUCT.md o DESIGN.md
      • Cambia el próximo paso esperado (§9)
   
   ❌ NO actualizar para:
      • Cambios cosméticos menores (typo, espacio)
      • Ejecuciones de skill que no resultaron en cambio aplicado
      • Análisis que ya quedan en Cerebro/ (referenciarlo, sí; duplicar, no)
```

**Cómo actualizar §11 Bitácora:**

Agrega una fila al inicio de la tabla (más reciente arriba):

```markdown
| 2026-MM-DD | [Descripción concisa del cambio] | [Quién: Brian, Claude, Codex] |
```

---

## 5. Cómo coexistir con el skill `impeccable`

```
   ╔══════════════════════════════════════════════════════════╗
   ║   REGLAS DE COEXISTENCIA                                  ║
   ╠══════════════════════════════════════════════════════════╣
   ║                                                            ║
   ║   1. PRODUCT.md y DESIGN.md SIEMPRE en raíz                ║
   ║      • El skill los busca ahí. No moverlos a Mente/Cerebro.║
   ║      • Si quieres analizarlos, escribe Cerebro/ APUNTANDO. ║
   ║                                                            ║
   ║   2. Mente/ se lee ANTES del skill                          ║
   ║      • Skill no sabe del estado actual del sitio.           ║
   ║      • Mente/Doc/Estado_Sesion sí. Cárgalo primero.         ║
   ║                                                            ║
   ║   3. Skill ejecuta tareas. Mente/ documenta aprendizajes.   ║
   ║      • Ejecutas `impeccable craft` → ejecuta y commitea.    ║
   ║      • Si aprendiste algo en el proceso útil para futuro:   ║
   ║        documéntalo en Mente/Cerebro/ después.               ║
   ║                                                            ║
   ║   4. NO modificar el skill                                  ║
   ║      • `.claude/skills/impeccable/` está ignorado por git.  ║
   ║      • Si necesitas extender capacidades, créalo en         ║
   ║        Mente/ como guía, NO toques el skill.                ║
   ║                                                            ║
   ║   5. Skill puede crear/modificar PRODUCT.md y DESIGN.md     ║
   ║      • Si lo hace, ACTUALIZA Mente/Doc/Estado_Sesion §11    ║
   ║        con fecha y motivo.                                  ║
   ║      • Esa es la traza que permite continuidad.             ║
   ║                                                            ║
   ╚══════════════════════════════════════════════════════════╝
```

### Comandos del skill y dónde queda traza

```
   COMANDO IMPECCABLE          DÓNDE QUEDA TRAZA EN MENTE/
   ─────────────────────────────────────────────────────────────
   teach                       PRODUCT.md/DESIGN.md cambian
                               → Estado_Sesion §11 Bitácora
   
   craft [feature]             Código cambia + posible PRODUCT/DESIGN
                               → Cuerpo/ si fue refactor importante
                               → Estado_Sesion §11 Bitácora
   
   audit [target]              AUDIT.md potencialmente cambia
                               → Estado_Sesion §6 Findings update
                               → Estado_Sesion §11 Bitácora
   
   critique [target]           Recomendaciones (no aplica solo)
                               → Cerebro/ si descubrió patrón
   
   shape [feature]             Plan de UX antes de craft
                               → Cuerpo/ si se aprobó
   
   document                    DESIGN.md cambia
                               → Estado_Sesion §11 Bitácora
   
   polish/bolder/quieter/...   Código cambia
                               → Estado_Sesion §11 si fue grande
```

---

## 6. Reglas no-negociables (NO se rompen)

```
   ✗ NO modificar textos del sitio sin permiso explícito Brian
   ✗ NO modificar PRODUCT.md ni DESIGN.md sin confirmación
   ✗ NO mover PRODUCT.md ni DESIGN.md fuera de raíz
   ✗ NO modificar AGENTS.md ni CLAUDE.md sin confirmación
   ✗ NO modificar el skill impeccable
   ✗ NO hacer commits a git sin pedirlo
   ✗ NO inventar nuevas capas (las 4 son fijas: Alma/Cerebro/Cuerpo/Doc)
   ✗ NO mover documentos entre capas sin dejar nota
   ✗ NO reescribir Estado_Sesion completo — solo agregar a bitácora
   ✗ NO duplicar contexto que vive en /for3s/Mente/ principal
   ✗ NO duplicar decisiones que viven en for3s-inter/
   ✗ NO romper la dualidad B2B Light / B2C Dark
   ✗ NO usar colores hardcoded (text-amber-*, hex en className)
   ✗ NO marketing language, em-dashes, anglicismos prohibidos
   ✗ NO asumir el Next.js que conoces (es Next 16)
   ✗ NO crear archivos en raíz salvo PRODUCT/DESIGN/AGENTS/CLAUDE/AUDIT/README
   
   ─────────────────────────────────────────────────────────────
   
   ✓ SÍ leer Mente/Doc/README.md y Estado_Sesion al entrar
   ✓ SÍ clasificar la tarea con el árbol §3
   ✓ SÍ usar templates §4 al crear docs en capas
   ✓ SÍ actualizar §5 del README cuando agregues un doc nuevo
   ✓ SÍ actualizar §11 Bitácora del Estado_Sesion cuando cambies estado real
   ✓ SÍ confirmar con Brian antes de mutaciones importantes
   ✓ SÍ usar tokens semánticos del design system
   ✓ SÍ leer node_modules/next/dist/docs/ antes de tocar Next 16
   ✓ SÍ ejecutar skill impeccable para tareas de diseño
   ✓ SÍ leer Mente/Doc/Impeccable_Workflow.md antes de tocar UI/UX
   ✓ SÍ usar `bun`, no `npm`, para scripts del proyecto
   ✓ SÍ preguntar ante duda
```

---

## 7. Plantillas rápidas (copy-paste)

### Plantilla agregar doc nuevo en `Mente/Cerebro/`:

```bash
# 1. Crea el archivo siguiendo template §4.2
# 2. Agrega al README §5.3:
```

```markdown
| [nombre_del_archivo.md](../Cerebro/nombre_del_archivo.md) | [Resumen 1 línea] | 2026-MM-DD |
```

```bash
# 3. Si el doc afecta estado del sitio, agrega a §11 del Estado_Sesion:
```

```markdown
| 2026-MM-DD | Análisis [tema] documentado en Mente/Cerebro/[archivo].md | [Quién] |
```

### Plantilla cerrar finding de AUDIT.md:

```markdown
# En Mente/Cuerpo/ crea bitácora:

## Resultado

Finding [#X] [SEV] resuelto el YYYY-MM-DD. Cambio aplicado en
[archivo.tsx]. Verificado con [comando]. Estado_Sesion §6 actualizado.
```

```bash
# Después actualiza Estado_Sesion §6:
# - Tacha el finding o muévelo a "Resueltos"
# - Actualiza §11 Bitácora
```

### Plantilla validar pregunta pendiente:

```markdown
# Pregunta de README §8 → respondida por Brian YYYY-MM-DD

## Pregunta original
[Copiar la pregunta del README §8]

## Respuesta de Brian
[Textual o resumen fiel]

## Cómo se aplica
[Cambios derivados en código, PRODUCT.md, DESIGN.md, otros docs]

## Pregunta cerrada
Marcar como resuelta en README §8 con link a este doc.
```

---

## 8. Casos especiales

### Caso A: "Brian me pidió hacer X pero no sé en qué capa"

```
   1. Pregunta a Brian. NO inventes capa.
   2. Si no puede responder: usa el árbol §3.
   3. Si árbol no es claro: va a Mente/Doc/ con nota al inicio
      "Documento ambiguo — pendiente de reclasificación".
   4. Notifica en chat para que Brian lo reclasifique.
```

### Caso B: "Necesito modificar PRODUCT.md o DESIGN.md"

```
   1. Pregunta a Brian explícitamente.
   2. Si aprueba: ejecuta el skill (`impeccable teach` o `document`).
   3. Después del cambio: agrega a §11 Bitácora del Estado_Sesion:
      "PRODUCT.md actualizado — motivo: [X]. Cambios: [Y]."
   4. Si el cambio invalida un análisis previo en Mente/Cerebro/,
      marca ese análisis como obsoleto (no lo borres).
```

### Caso C: "El sitio rompió y necesito fix urgente"

```
   1. Aplica fix mínimo. Documenta brevemente en commit.
   2. Después del fix: crea bitácora en Mente/Cuerpo/:
      "fix_urgente_YYYYMMDD_[descripción].md"
   3. Si fix descubre patrón importante para futuro:
      crea análisis derivado en Mente/Cerebro/.
   4. Actualiza Estado_Sesion §11 Bitácora.
```

### Caso D: "Encuentro inconsistencia entre Mente/ y código real"

```
   1. NO modifiques Mente/ inmediatamente.
   2. Pregunta a Brian si la inconsistencia es:
      a) Mente/ está desactualizada → actualiza Mente/ + bitácora
      b) Código se desvió de la intención → plan en Cuerpo/ para corregir
      c) La realidad cambió la intención → actualiza Alma/Cerebro/
   3. Documenta la resolución en Estado_Sesion §11.
```

### Caso E: "Otro agente (Codex/GPT) trabajó antes que yo"

```
   1. Lee Mente/Doc/Estado_Sesion §11 Bitácora — ahí verás qué hicieron.
   2. Lee últimos 5 commits git para confirmar.
   3. Si el otro agente dejó docs en Mente/, respétalos.
   4. Si crees que algo está mal hecho: NO sobreescribas.
      Crea doc nuevo apuntando al viejo y marca el viejo como obsoleto.
   5. Pregunta a Brian para resolver.
```

### Caso F: "La estructura Mente/ se siente limitante para mi tarea"

```
   1. NO crees nuevas capas. Las 4 son fijas.
   2. NO crees nuevos archivos en Mente/Doc/ sin permiso.
   3. Si tu tarea no cabe: probablemente NO debe vivir en Mente/.
      Considera si va en código, en for3s-inter/, o en /for3s/Mente/.
   4. Pregunta a Brian dónde clasificarlo.
```

---

## 9. Diferencias específicas por agente

### Claude (Claude Code en CLI)

```
   ●  Tiene acceso a Read, Edit, Write, Bash
   ●  Puede actualizar memoria global en
      /home/brianweb3/.claude/projects/-home-brianweb3-for3s/memory/
   ●  Para Mente/ local: usa Read + Edit + Write nativos
   ●  Skill impeccable se invoca con /impeccable [command]
   ●  Antes de cualquier mutación: confirma con Brian
   ●  Cumple TodoWrite solo si la tarea es multi-step compleja
```

### Codex (OpenAI CLI / Cursor / Cline)

```
   ●  Sigue el mismo protocolo de entrada (Pasos 1-6 §2)
   ●  NO tiene memoria global Claude — depende 100% de Mente/Doc/
   ●  Estado_Sesion_Continuidad.md ES su memoria
   ●  Si va a usar el skill impeccable, debe pasar el preflight:
      IMPECCABLE_PREFLIGHT: context=pass product=pass ...
   ●  Para coexistir: NUNCA borrar Mente/ ni reorganizar capas
```

### GPT-4 / GPT-5 (ChatGPT con file access)

```
   ●  Misma disciplina que Codex
   ●  No tiene memoria persistente entre conversaciones
   ●  Estado_Sesion es su única continuidad
   ●  Si no tiene acceso al filesystem: pídele a Brian
      copiar Estado_Sesion al chat antes de empezar
```

### Agentes futuros (cualquiera)

```
   ●  Si lee este manual: ya sabe operar.
   ●  Si NO lee este manual: probablemente romperá algo.
   ●  Brian debe forzar al agente nuevo a leer:
      - CLAUDE.md → AGENTS.md (existente)
      - Mente/Doc/README.md
      - Mente/Doc/Estado_Sesion_Continuidad.md
      - Mente/MANUAL_USO_IA.md (este archivo)
```

---

## 10. Cómo ACTUALIZAR este manual

Este manual también es append-mostly. Si necesitas modificarlo:

```
   ✗ NO reescribas secciones enteras
   ✗ NO borres reglas existentes (márcalas obsoletas)
   ✗ NO cambies las 3 verdades del §1 sin permiso de Brian
   
   ✓ SÍ agrega nuevos casos especiales en §8
   ✓ SÍ agrega nuevos agentes en §9 cuando aparezcan
   ✓ SÍ agrega plantillas nuevas en §7
   ✓ SÍ actualiza la fecha "Última actualización" al inicio
   ✓ SÍ documenta el cambio en Estado_Sesion §11 Bitácora
```

Si la propuesta de cambio es importante:
1. Crea borrador en `Mente/Cuerpo/` ("plan_actualizar_manual_ia.md")
2. Confirma con Brian
3. Aplica al manual
4. Bitácora en Estado_Sesion

---

## 11. Checklist al CERRAR una sesión

Antes de terminar tu turno, verifica:

```
   [ ] ¿Modifiqué código del sitio? → §11 Bitácora actualizada
   [ ] ¿Modifiqué PRODUCT.md/DESIGN.md? → §11 Bitácora + nota motivo
   [ ] ¿Resolví un finding AUDIT? → §6 Estado_Sesion actualizada
   [ ] ¿Creé doc en Alma/Cerebro/Cuerpo? → §5 README actualizado
   [ ] ¿Brian respondió pregunta pendiente? → §8 README marcada resuelta
   [ ] ¿Hay próximo paso nuevo esperado? → §9 Estado_Sesion actualizada
   [ ] ¿Aprendí algo importante para futuros agentes? → Mente/Cerebro/
   [ ] ¿El próximo agente entrará con suficiente contexto? → verificar
       que Estado_Sesion permite responder los 10 ítems del §10 de él
```

Si TODO está ✅, puedes cerrar la sesión sabiendo que el próximo agente continuará sin perder contexto.

---

## 12. Si tienes dudas (jerarquía de fuentes)

Cuando algo no quede claro, consulta en este orden:

```
   1. Este manual (Mente/MANUAL_USO_IA.md)
   2. Mente/Doc/README.md (índice maestro)
   3. Mente/Doc/Estado_Sesion_Continuidad.md (estado actual)
   4. PRODUCT.md y DESIGN.md (raíz del repo)
   5. AGENTS.md y CLAUDE.md (raíz, reglas Next 16)
   6. AUDIT.md (último estado calidad)
   7. docs/I18N_IMPLEMENTATION_GUIDE.md (guía técnica i18n)
   8. .claude/skills/impeccable/SKILL.md y reference/ (skill IA)
   9. /home/brianweb3/for3s/Mente/Doc/README.md (Mente principal,
      solo si necesitas contexto de For3s OS plataforma)
   10. PREGUNTA A BRIAN
```

---

**Fin del Manual de uso IA para `Mente/` en `marca-personal/`.**

**Si has leído este documento completo, estás listo para operar `Mente/` con la disciplina que Brian espera. Bienvenido al sistema.**
