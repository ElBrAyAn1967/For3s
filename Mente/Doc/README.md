# marca-personal/Mente/Doc — Índice Maestro

**Owner:** Brian López
**Repo:** `marca-personal/` (sitio público For3s — Next.js 16)
**Última actualización:** 2026-06-03
**Estatus:** Activo

---

## 🚨 PROTOCOLO DE CONTINUIDAD (LEER PRIMERO SI RETOMAS LA CONVERSACIÓN)

**Si eres Claude/agente que retoma la conversación con Brian en este repo (o el mismo Claude tras compactación de contexto):**

### Paso 1 — Lee SIEMPRE primero este documento

➡️ **[Estado_Sesion_Continuidad.md](Estado_Sesion_Continuidad.md)** ⬅️

Este documento es **la memoria operativa cross-sesión del SITIO PÚBLICO** `marca-personal/`. Contiene:

- Qué es `marca-personal/` y cuál es su rol en el ecosistema For3s
- Stack actual (Next.js 16, React 19, Tailwind v4, shadcn, Bun)
- Estado real del sitio (production-ready según AUDIT.md 2026-05-11)
- Dual-mode B2B/B2C foundation (verde institucional vs ámbar builder)
- Decisiones de diseño LOCKED (DESIGN.md + PRODUCT.md)
- Findings pendientes de AUDIT.md (2 MED, 2 LOW)
- Relación con el resto del universo For3s (Mente principal + for3s-inter)
- Reglas de conversación con Brian (qué hacer, qué NO hacer)
- Próximo paso esperado en la conversación

### Paso 2 — Lee el orden de prioridad

Si solo tienes tiempo para 5 documentos, léelos en este orden:

1. **`Mente/Doc/Estado_Sesion_Continuidad.md`** — saber dónde estamos en el sitio
2. **`PRODUCT.md`** (raíz) — dual-mode positioning, audiencias, voz, anti-referencias
3. **`DESIGN.md`** (raíz) — design system completo (colores, tipografía, tokens)
4. **`AGENTS.md`** (raíz) — "este NO es el Next.js que conoces" (Next 16 cambió APIs)
5. **`AUDIT.md`** (raíz) — última auditoría de coherencia (2026-05-11)
6. **`Mente/Doc/Impeccable_Workflow.md`** — protocolo obligatorio para usar `impeccable` en tareas de UI/UX/diseño

### Paso 3 — Antes de responder, confirma

Antes de modificar el sitio, **pregúntale a Brian dónde quedamos**. NO asumas. NO inventes contexto. NO modifiques textos sin confirmación (regla explícita: "no modificar textos").

### Paso 4 — Lee el manual de uso

➡️ **[../MANUAL_USO_IA.md](../MANUAL_USO_IA.md)** ⬅️

Este manual te dice **cómo operar `Mente/` correctamente**: cuándo escribir en cada capa, qué plantillas usar, cómo coexistir con el skill `impeccable`, cómo actualizar la bitácora, qué nunca hacer. **Es obligatorio leerlo antes de tocar `Mente/`.**

### Paso 5 — Coexistencia con `.claude/skills/impeccable/`

Este repo ya tiene el skill `impeccable` instalado (`.claude/skills/impeccable/`). El protocolo de continuidad de `Mente/Doc/` **no reemplaza** al skill: lo **precede**. Flujo correcto:

```
1. Agente entra al repo
2. Lee CLAUDE.md → AGENTS.md (existente)
3. Lee Mente/Doc/README.md (este archivo)
4. Lee Mente/Doc/Estado_Sesion_Continuidad.md
5. Lee `Mente/Doc/Impeccable_Workflow.md`
6. Si la tarea es diseño/UI/UX → continúa con skill impeccable
7. Si la tarea es contenido/copy/i18n → continúa con PRODUCT.md
```

### Reglas no-negociables al retomar

```
   ✗ NO modificar textos del sitio sin permiso explícito (regla Brian)
   ✗ NO modificar PRODUCT.md ni DESIGN.md sin confirmación
   ✗ NO hacer commits a git sin pedirlo
   ✗ NO instalar dependencias nuevas sin justificar contra package.json
   ✗ NO romper la dualidad B2B Light / B2C Dark (es decisión estratégica)
   ✗ NO usar colores hardcoded (`text-amber-*`, hex en className)
   ✗ NO marketing language, NO floreo, NO em-dashes
   ✗ NO anglicismos prohibidos: leverage, empower, unlock

   ✓ SÍ honestidad técnica brutal (regla explícita de Brian)
   ✓ SÍ usar tokens semánticos del design system
   ✓ SÍ verificar contra DESIGN.md y PRODUCT.md
   ✓ SÍ respetar dualidad Light=B2B / Dark=B2C
   ✓ SÍ preguntar ante duda
   ✓ SÍ leer node_modules/next/dist/docs/ antes de tocar Next 16
```

**Si has leído `Estado_Sesion_Continuidad.md` y las reglas, puedes continuar la sesión sin perder contexto. Brian va a sentir continuidad real, no improvisación.**

---

## 1. Propósito de esta carpeta

`marca-personal/Mente/Doc/` es el **índice y la capa de documentos transversales** de la arquitectura `Mente/` dentro del repo `marca-personal/`. Vive en paralelo a `Alma/`, `Cerebro/` y `Cuerpo/`, no dentro de ninguna de ellas.

**Lo que vive aquí (dentro de `marca-personal/`):**

- Documentos fundacionales que cruzan varias capas del SITIO (no son puramente Alma, ni Cerebro, ni Cuerpo).
- Cristalizaciones de sesiones de diseño/desarrollo del sitio que se quieren preservar.
- Reglas de gobierno de la propia Mente local del repo.
- Índices y mapas de navegación del repo.
- Bitácora de evolución del sitio.

**Lo que NO vive aquí:**

- Documentos del producto/diseño consumidos por el skill impeccable → siguen en raíz (`PRODUCT.md`, `DESIGN.md`).
- Configuración de IA o reglas para agentes Next → siguen en raíz (`AGENTS.md`, `CLAUDE.md`).
- Auditorías técnicas formales → siguen en raíz (`AUDIT.md`).
- Documentos puramente filosóficos del founder For3s OS → viven en `/home/brianweb3/for3s/Mente/Alma/` (Mente principal).
- Decisiones de empresa LOCKED → viven en `/home/brianweb3/for3s/for3s-inter/`.
- Pensamiento técnico For3s OS (plataforma) → vive en `/home/brianweb3/for3s/Mente/` (Mente principal).
- Código → vive en `app/`, `components/`, `lib/`, etc. del propio repo.

---

## 2. Cómo se relaciona este `Mente/` con el resto del universo For3s

Esta es la regla de precedencia y convivencia. **CRÍTICO entender esto** antes de tocar nada.

```
┌─────────────────────────────────────────────────────────────┐
│  /home/brianweb3/for3s/Mente/  — MENTE PRINCIPAL            │
│  ────────────────────────────────────────────────           │
│  La capa META de For3s OS (plataforma "segundo cerebro")    │
│                                                             │
│  ├── Alma/     — Visión For3s Frontier, convicciones        │
│  ├── Cerebro/  — Grafo Maestro, 11 nodos, marcos teóricos   │
│  ├── Cuerpo/   — Rondas R1-R10, arquitectura ejecutable     │
│  └── Doc/      — Estado_Sesion cross-sesión, gobierno       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
              ↓ alimenta y precede a
┌─────────────────────────────────────────────────────────────┐
│  /home/brianweb3/for3s/for3s-inter/  — COMPANY OS           │
│  ────────────────────────────────────────────────           │
│  Decisiones operativas LOCKED (D-001...D-013)               │
│  For3s QA wedge comercial vive aquí                          │
└─────────────────────────────────────────────────────────────┘
              ↓ alimenta cuando hay evidencia
┌─────────────────────────────────────────────────────────────┐
│  /home/brianweb3/for3s/marca-personal/  — SITIO PÚBLICO     │
│  ────────────────────────────────────────────────           │
│  Refleja lo que ya tiene evidencia y está LOCKED            │
│                                                             │
│  ├── Mente/    ◄── ESTE Mente/ (local al sitio)              │
│  │   ├── Alma/     — visión específica del sitio             │
│  │   ├── Cerebro/  — análisis UX, mapas de audiencia         │
│  │   ├── Cuerpo/   — arquitectura técnica frontend          │
│  │   └── Doc/      — este README + Estado_Sesion del sitio  │
│  │                                                          │
│  ├── PRODUCT.md, DESIGN.md   — consumidos por skill         │
│  ├── AGENTS.md, CLAUDE.md    — reglas para agentes Next     │
│  └── app/, components/, lib/ — código Next.js               │
└─────────────────────────────────────────────────────────────┘
```

**Regla de oro:**

- **Mente principal (`for3s/Mente/`)** = donde se **piensa** la plataforma.
- **for3s-inter/** = donde se **decide** la operación.
- **marca-personal/** = donde se **muestra** lo decidido al mundo.
- **marca-personal/Mente/** (este) = donde se **piensa el sitio mismo** (no la plataforma).

Nunca se salta capas hacia adelante (no piensas en el sitio antes de decidir).
Sí se puede ir hacia atrás (un finding del sitio puede revisitar un supuesto de `Mente/` principal).

---

## 3. Las 4 capas — qué va dónde (contexto sitio)

### 3.1 `marca-personal/Mente/Alma/` — El "por qué" del sitio

**Pregunta que responde:** ¿Por qué este sitio existe así? ¿Qué nunca cambia en su voz/visión?

**Qué guardar:**
- Convicciones no-negociables del sitio (ej: "dual-mode es estratégico, no decoración").
- Insights crudos sobre el SITIO antes de procesarlos racionalmente.
- Reflexiones sobre identidad pública de For3s y de Brian López.
- Lo que distingue este sitio de "un portafolio más".
- Manifiestos cortos / declaraciones de voz pública.

**Qué NO guardar:**
- Análisis técnicos frontend → van a `Cerebro/`.
- Planes ejecutables de implementación → van a `Cuerpo/`.
- Decisiones formales con fecha y owner → van a `AUDIT.md` o `for3s-inter/`.
- Visión completa de For3s OS (plataforma) → vive en `for3s/Mente/Alma/Vision_For3s_Frontier.md`.

**Cuándo escribir aquí:** cuando algo te resuene sobre el SITIO como "esto importa pero no sé cómo formalizarlo". Captura primero, racionaliza después.

### 3.2 `marca-personal/Mente/Cerebro/` — El "qué pienso" sobre el sitio

**Pregunta que responde:** ¿Qué entiendo de las audiencias, del diseño, del Next.js 16, de los patrones UX?

**Qué guardar:**
- Análisis profundos de audiencias B2B/B2C (extender PRODUCT.md sin tocarlo).
- Mapas conceptuales (jornadas de usuario, embudos de conversión).
- Estudios de competencia (otros portafolios de founders LATAM).
- Modelos mentales sobre cómo debería funcionar el sitio.
- Síntesis de aprendizaje técnico (Next.js 16, App Router patterns).
- Análisis post-mortem de A/B tests o cambios.

**Qué NO guardar:**
- PRODUCT.md o DESIGN.md → siguen en raíz (consumidos por skill `impeccable`).
- Convicciones puras → van a `Alma/`.
- Diseños técnicos concretos para construir → van a `Cuerpo/`.

**Cuándo escribir aquí:** cuando termines una sesión de aprendizaje, investigación de competencia, o análisis profundo de comportamiento de usuarios.

### 3.3 `marca-personal/Mente/Cuerpo/` — El "qué hago" en el sitio

**Pregunta que responde:** ¿Cómo se construye, refactoriza o evoluciona el sitio?

**Qué guardar:**
- Arquitecturas técnicas concretas (refactors propuestos, migración de páginas).
- Bocetos de nuevas secciones, prototipos de componentes.
- Planes de ejecución de features (i18n para nuevos idiomas, nuevas Docs).
- Diseños de experimentos (A/B tests, variantes Hero).
- Conexiones entre análisis de `Cerebro/` y entregables reales del sitio.
- Bitácora de cambios técnicos importantes.

**Qué NO guardar:**
- Código → va en `app/`, `components/`, `lib/`.
- Auditorías ejecutadas → van a `AUDIT.md` en raíz.
- Roadmaps formales con fechas y compromisos comerciales → van a `for3s-inter/`.

**Cuándo escribir aquí:** cuando un análisis de `Cerebro/` esté listo para volverse plano de construcción del sitio.

### 3.4 `marca-personal/Mente/Doc/` — Lo transversal

**Pregunta que responde:** ¿Qué cruza capas o gobierna la propia Mente local del sitio?

**Qué guardar:**
- Cristalizaciones de sesiones de discusión que tocan Alma + Cerebro + Cuerpo del sitio.
- Índices, mapas, reglas de gobierno de esta Mente local.
- Estado_Sesion_Continuidad para preservar contexto cross-sesión.
- Bitácoras de evolución del propio sitio.
- Protocolos de retomada para agentes IA.

**Cuándo escribir aquí:** cuando lo que tienes mezcla varias capas y separarlo lo rompería, o cuando es meta-gobierno de la Mente local.

---

## 4. Protocolo "¿Dónde guardo esto?" (versión sitio)

Cuando dudes dónde va un documento dentro de `marca-personal/`, aplica este árbol de decisión en orden:

1. **¿Es código?** → `app/`, `components/`, `lib/`. NO va en `Mente/`.
2. **¿Es PRODUCT.md o DESIGN.md (consumidos por skill impeccable)?** → raíz del repo. NO va en `Mente/`.
3. **¿Es configuración de agentes/Next (AGENTS.md, CLAUDE.md)?** → raíz. NO va en `Mente/`.
4. **¿Es auditoría técnica formal con fecha y findings?** → `AUDIT.md` en raíz.
5. **¿Es contenido para el sitio (copy, i18n)?** → `messages/{es,en}.json` o `lib/data.ts`.
6. **¿Es pensamiento sobre la plataforma For3s OS (no sobre el sitio)?** → `/home/brianweb3/for3s/Mente/`. NO va aquí.
7. **¿Cruza varias capas Alma/Cerebro/Cuerpo del SITIO y separarlo lo rompería?** → `Mente/Doc/`.
8. **¿Es un "por qué" no-negociable del sitio, convicción, intuición cruda?** → `Mente/Alma/`.
9. **¿Es análisis UX, audiencia, competencia, patrón Next.js, modelo mental?** → `Mente/Cerebro/`.
10. **¿Es plan técnico concreto, refactor propuesto, arquitectura ejecutable del sitio?** → `Mente/Cuerpo/`.

Si después de las 10 preguntas sigues dudando, va a `Mente/Doc/` con nota al inicio indicando por qué fue ambiguo. Eso afina las reglas con el tiempo.

---

## 5. Inventario actual de documentos

### 5.1 `Mente/` (raíz de la mente local)

| Documento | Resumen | Fecha |
|---|---|---|
| ⭐ [MANUAL_USO_IA.md](../MANUAL_USO_IA.md) | **MANUAL DE OPERACIÓN PARA AGENTES IA** (Claude, Codex, GPT, futuros). Define cuándo escribir en cada capa, plantillas, coexistencia con skill impeccable, casos especiales, checklist al cerrar sesión. Es READ-FIRST para cualquier agente que vaya a tocar `Mente/`. | 2026-06-03 |

### 5.2 `Mente/Doc/`

| Documento | Resumen | Fecha |
|---|---|---|
| [README.md](README.md) | Este índice maestro. Reglas de gobierno de `Mente/` local + protocolo de continuidad al inicio. | 2026-06-03 |
| ⭐ [Estado_Sesion_Continuidad.md](Estado_Sesion_Continuidad.md) | **DOCUMENTO DE CONTINUIDAD CROSS-SESIÓN DEL SITIO.** Leer SIEMPRE primero al retomar. Estado real del sitio, stack, audiencias, dual-mode, findings AUDIT pendientes, próximo paso esperado. | 2026-06-03 |
| ⭐ [Impeccable_Workflow.md](Impeccable_Workflow.md) | **PROTOCOLO DE USO DE IMPECCABLE.** Define cuándo usar `impeccable`, cómo verificar instalación, preflight obligatorio, mapeo de comandos, relación con `Mente/`, y checks `bun` posteriores. | 2026-06-03 |

### 5.3 `Mente/Alma/`

| Documento | Resumen | Fecha |
|---|---|---|
| _(vacío — primera convicción que documentes irá aquí)_ | — | — |

**Candidatos sugeridos** (no creados, solo idea):
- `dual_mode_es_estrategia.md` — por qué Light/Dark NO es preferencia, es posicionamiento.
- `por_que_existe_este_sitio.md` — el sitio como prueba de operación, no portfolio.
- `voz_brian_publica.md` — qué nunca decimos en público sobre Brian/For3s.

### 5.4 `Mente/Cerebro/`

| Documento | Resumen | Fecha |
|---|---|---|
| _(vacío — primer análisis profundo irá aquí)_ | — | — |

**Candidatos sugeridos** (no creados, solo idea):
- `audiencias_extendidas.md` — profundizar más allá de los 4 contextos de PRODUCT.md.
- `nextjs_16_aprendizajes.md` — qué cambió vs Next 15, traps descubiertas.
- `competencia_portafolios_founders.md` — análisis de otros sitios LATAM de founders técnicos.
- `embudos_conversion_observados.md` — análisis de comportamiento real cuando haya datos.

### 5.5 `Mente/Cuerpo/`

| Documento | Resumen | Fecha |
|---|---|---|
| _(vacío — primer plan técnico irá aquí)_ | — | — |

**Candidatos sugeridos** (no creados, solo idea):
- `plan_seccion_docs_v2.md` — refactor próximo de la sección Docs.
- `roadmap_i18n_idiomas_nuevos.md` — agregar portugués/francés en el futuro.
- `prototipo_demo_seccion.md` — diseño técnico de una nueva sección demo.

---

## 6. Reglas de mantenimiento de este índice

- **Cada vez que se agrega un documento a cualquier capa**, debe registrarse en la sección 5 de este README.
- **Cada vez que cambia una regla de gobierno**, se actualiza la sección correspondiente y se anota la fecha del cambio al inicio del documento.
- **Este README es append-mostly**, no se reescribe. Si una regla se invalida, se marca como obsoleta y se referencia la nueva en su lugar.
- **No se mueve un documento entre capas sin dejar nota** en este README de dónde estaba y por qué se movió.
- **Si modificas PRODUCT.md o DESIGN.md**, actualiza también `Estado_Sesion_Continuidad.md` con la fecha y el motivo.

---

## 7. Coexistencia con `.claude/skills/impeccable/`

Este repo tiene instalado el skill `impeccable` de Anthropic (frontend design skill). El skill busca `PRODUCT.md` y `DESIGN.md` en raíz para hacer su trabajo.

**Documento operativo obligatorio:** [Impeccable_Workflow.md](Impeccable_Workflow.md)

**Reglas de coexistencia:**

- `Mente/` y el skill **viven en paralelo**, no compiten.
- `PRODUCT.md` y `DESIGN.md` siguen en raíz (no se mueven a `Mente/Cerebro/`).
- El protocolo de continuidad de `Mente/Doc/` se ejecuta **antes** del skill, no en lugar de.
- Si el agente va a ejecutar `/impeccable craft|shape|audit|...`, primero debe haber leído `Mente/Doc/Estado_Sesion_Continuidad.md` para entender el contexto histórico.
- Si la tarea toca interfaz, el agente debe leer `Impeccable_Workflow.md` y declarar el preflight antes de mutar UI.
- Cualquier nuevo skill instalado en `.claude/skills/` no requiere actualizar `Mente/Doc/` salvo que afecte gobierno.

**Flujo correcto de un agente nuevo:**

```
1. Entra al repo
2. Lee CLAUDE.md → AGENTS.md (no modificar)
3. Lee Mente/Doc/README.md (este archivo)
4. Lee Mente/Doc/Estado_Sesion_Continuidad.md
5. Lee Mente/Doc/Impeccable_Workflow.md si la tarea toca UI/UX/diseño
6. Identifica tipo de tarea:
   • Diseño / UX / UI / refactor visual → skill impeccable (PRODUCT.md + DESIGN.md)
   • Copy / i18n / contenido → lee messages/, lib/data.ts
   • Arquitectura técnica → Mente/Cerebro/ + Mente/Cuerpo/
   • Decisión estratégica del sitio → Mente/Alma/
7. Antes de mutar archivos, confirma con Brian
```

---

## 8. Preguntas pendientes de validación con el founder

Estas son las preguntas que afinarán esta estructura sobre la marcha:

1. **¿Mente/ local del sitio debe sincronizarse periódicamente con Mente/ principal?** ¿O viven independientes? (Hoy: independientes; cada uno con su scope.)
2. **¿Estado_Sesion del sitio debe replicar la identidad de Brian / anclas LOCKED, o solo apuntar al de la Mente principal?** (Hoy: solo apunta, no duplica. Evitar 2 fuentes de verdad.)
3. **¿Algún día migraremos PRODUCT.md y DESIGN.md a `Mente/Cerebro/`?** (Hoy: NO. Riesgo de romper gates del skill `impeccable`. Reconsiderar si Anthropic permite override de path en skill.)

Cuando estas se resuelvan, este README se actualiza para reflejar las definiciones finales.

---

## 9. Cierre

Esta `Mente/` local NO es un repo más. Es la capa más alta del stack del SITIO: donde se piensa el sitio antes de tocarlo, y se preserva el contexto entre sesiones para que cualquier IA (Claude, Codex, GPT) que retome el trabajo lo haga **con memoria, no improvisando**.

La disciplina de mantener separadas las 4 capas (Alma, Cerebro, Cuerpo, Doc) localmente — replicando la arquitectura de la Mente principal — es lo que evita que el sitio drifte de la visión global de For3s.

---

**Fin del índice maestro de `marca-personal/Mente/`.**

**Referencia cruzada:** índice maestro de la Mente principal vive en `/home/brianweb3/for3s/Mente/Doc/README.md`.
