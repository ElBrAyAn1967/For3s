# Estado de Sesión — Continuidad cross-sesión del SITIO

**Repo:** `marca-personal/` (sitio público For3s)
**Owner:** Brian López
**Última actualización:** 2026-06-03
**Estatus:** Activo · Production-ready
**Fuente de verdad técnica:** `PRODUCT.md` + `DESIGN.md` + `AUDIT.md` (raíz del repo)
**Protocolo UI/UX:** `Mente/Doc/Impeccable_Workflow.md`

---

## 🎯 Para qué sirve este documento

Cuando un nuevo Claude (o el mismo tras compactación de contexto) retoma trabajo en este repo, **este es el único documento que necesita leer para saber dónde quedamos**.

Sin esto: el agente reinventa contexto, propone cambios fuera de scope, rompe la voz del sitio.
Con esto: el agente entra en frío y entiende el estado real, las reglas, lo pendiente, y el próximo paso esperado.

---

## 1. Qué es `marca-personal/`

```
   ╔══════════════════════════════════════════════════════════╗
   ║   marca-personal = SITIO PÚBLICO de Brian López           ║
   ║                                                            ║
   ║   ●  NO es un repo de pensamiento (eso es /for3s/Mente/)   ║
   ║   ●  NO es operación de empresa (eso es for3s-inter/)      ║
   ║   ●  SÍ es producción Next.js viva (production-ready)       ║
   ║                                                            ║
   ║   Rol en el universo For3s:                                 ║
   ║   "donde se MUESTRA lo que ya está LOCKED"                  ║
   ╚══════════════════════════════════════════════════════════╝
```

**Propósito declarado en PRODUCT.md:**

> For3s es la empresa de infraestructura para agentes de IA construida desde LATAM, con un sistema dual que sirve a la empresa en horario laboral y al builder en horario nocturno.

Construido en colaboración con **Frutero Club** (ecosistema LATAM) y **Godinez Studio** (estudio de producto y desarrollo).

---

## 2. Stack actual (snapshot 2026-06-03)

```
FRAMEWORK
   ●  Next.js 16.2.4 (App Router + Turbopack)
   ●  React 19.2.4
   ●  TypeScript 5.x
   ●  Bun (package manager)

UI
   ●  Tailwind CSS v4
   ●  shadcn/ui (components.json)
   ●  Base UI (@base-ui/react) ◄── primitivos
   ●  Framer Motion 12.38 (animaciones)
   ●  Lucide React (iconos)

I18N
   ●  next-intl 4.11
   ●  2 locales: es, en
   ●  Estructura: app/[locale]/...
   ●  Contenido: messages/{es,en}.json
   ●  Source of truth estructural: lib/data.ts

DESIGN SYSTEM
   ●  Dark mode hardcoded por default (PRODUCT.md aclara dualidad)
   ●  OKLCH color space
   ●  Tokens semánticos (foreground-*, surface-*, edge-*, icon-*)
   ●  Brand: ámbar #EF9B11 (Dark) + verde #174023 (Light)
   ●  Inter Variable + Fira Mono (Google Fonts)

ANALYTICS
   ●  @microsoft/clarity 1.0.2

DEV TOOLS
   ●  knip (dead code detection)
   ●  react-doctor (audits)
   ●  ESLint 9 + Next config
   ●  impeccable (UI/UX/design workflow via .claude/skills/impeccable/)
```

⚠️ **CRÍTICO Next.js 16:** la versión usada tiene breaking changes vs tu training data. SIEMPRE leer `node_modules/next/dist/docs/` antes de tocar APIs. Regla establecida en `AGENTS.md` raíz.

---

## 3. Estructura del repo (snapshot 2026-06-03)

```
marca-personal/
   │
   ├── 📄 Docs de producto (raíz, leídos por IA)
   │   ├── README.md                  (intro técnica del sitio)
   │   ├── PRODUCT.md                 (dual-mode, audiencias, voz, 27 KB)
   │   ├── DESIGN.md                  (design system completo, 22 KB)
   │   ├── AGENTS.md                  (reglas Next 16 para agentes)
   │   ├── CLAUDE.md                  (apunta a @AGENTS.md)
   │   └── AUDIT.md                   (auditoría 2026-05-11)
   │
   ├── 🌐 Código Next.js
   │   ├── app/[locale]/              (i18n routes)
   │   │   ├── page.tsx               (landing)
   │   │   ├── docs/                   (sección Docs)
   │   │   └── demo/                   (sección Demo)
   │   ├── components/
   │   │   ├── sections/               (Hero, About, Projects, Skills,
   │   │   │                            Timeline, Contact, Faq, etc.)
   │   │   ├── shared/                 (Navbar, Footer)
   │   │   ├── ui/                     (shadcn primitives)
   │   │   └── docs/                   (componentes específicos Docs)
   │   ├── lib/
   │   │   └── data.ts                 (source of truth estructural)
   │   ├── messages/
   │   │   ├── es.json
   │   │   └── en.json
   │   ├── i18n/                       (configuración next-intl)
   │   └── public/                     (assets estáticos)
   │
   ├── 🤖 Infraestructura IA
   │   ├── .claude/skills/impeccable/  (skill diseño frontend Anthropic)
   │   │   ├── SKILL.md
   │   │   ├── reference/              (35 markdown refs)
   │   │   └── scripts/                (21 scripts .mjs)
   │   └── skills-lock.json            (hash verificación)
   │
   ├── 📚 docs/
   │   └── I18N_IMPLEMENTATION_GUIDE.md  (guía técnica i18n, 1814 líneas)
   │
   ├── 🧠 Mente/ ◄── ESTE NUEVO (creado 2026-06-03)
   │   ├── Alma/                       (vacío, esperando primer doc)
   │   ├── Cerebro/                    (vacío, esperando primer doc)
   │   ├── Cuerpo/                     (vacío, esperando primer doc)
   │   └── Doc/
   │       ├── README.md               (índice maestro local)
   │       ├── Impeccable_Workflow.md   (protocolo UI/UX/diseño)
   │       └── Estado_Sesion_Continuidad.md  (este archivo)
   │
   └── ⚙️ Config
       ├── package.json
       ├── tsconfig.json
       ├── eslint.config.mjs
       ├── postcss.config.mjs
       ├── next.config.ts
       ├── proxy.ts
       ├── components.json (shadcn)
       ├── knip.json
       ├── react-doctor.config.json
       └── bun.lock
```

---

## 4. Dual-mode B2B/B2C (decisión foundation LOCKED)

**LO MÁS IMPORTANTE de entender antes de tocar nada visual:**

```
   ╔═══════════════════════════════════════════════════════════╗
   ║   FOR3S OPERA DOS MODOS VISUALES SIMULTÁNEOS.              ║
   ║   NO SON OPCIONES DEL MISMO SITIO.                          ║
   ║   SON DOS POSICIONAMIENTOS EN UNA IDENTIDAD.                ║
   ╚═══════════════════════════════════════════════════════════╝

   LIGHT MODE = B2B (Soft Tech)              DARK MODE = B2C (Deep Tech)
   ──────────────────────────────────        ──────────────────────────────────
   Color identidad: verde #174023            Color identidad: ámbar #EF9B11
   Audiencia: comités, evaluación,           Audiencia: builders nocturnos,
              corporativo                                founders técnicos,
                                                         devs LATAM
   Estado mental: due diligence,              Estado mental: construcción,
                  oficina, sala de juntas                    café 11pm, hoodie
   Función emocional: "bosque corporativo"   Función emocional: "láser precisión"
   Anti-emoción: hacker, caos visual         Anti-emoción: comité frío,
                                                            condescendencia
```

**Token mágico:** `--brand-bold` resuelve la elección por modo:
- Light → `--c-green-30` (verde)
- Dark → `--c-brand-70` (ámbar)

**REGLA:** toda decisión visual de identidad consume `--brand-bold` o `--foreground-accent`, NUNCA color crudo directo.

---

## 4.1. Enfoque activo — Modo claro For3s QA (2026-06-03)

**Decisión de sesión:** por ahora el trabajo se enfoca SOLO en el **modo claro** de `marca-personal/`.

Scope actual acordado con Brian:

```
   AHORA
   ────────────────────────────────────────────────────────────
   ● Estilo visual del modo claro.
   ● Paleta, contraste, jerarquía visual, espaciado.
   ● Sensación de producto SaaS serio + operacional QA.
   ● Botones, bordes, fondos, ritmo entre secciones.
   ● Mantener For3s QA como foco del modo claro.

   DESPUÉS
   ────────────────────────────────────────────────────────────
   ● Correcciones de tono.
   ● Correcciones de contenido/copy.
   ● Revisión de contenedores y composición profunda.
   ● Ajustes narrativos del hero, ecosistema, piloto, FAQ.

   NO TOCAR AHORA
   ────────────────────────────────────────────────────────────
   ● Modo oscuro.
   ● Narrativa builder/dark.
   ● Cambios de texto sin discutirlos primero.
   ● Reestructuras profundas de contenido.
```

Diagnóstico actual del modo claro:

- Ya está armado como landing B2B de **For3s QA**.
- El mensaje principal actual es: "Convierte contexto desordenado en QA claro."
- Las secciones Light existentes son: `HeroLight`, `AboutLight`, `ProjectsLight`, `SkillsLight`, `TimelineLight`, `FaqLight`, `ContactLight`.
- El tono actual es sobrio, institucional, explicativo, prudente y orientado a confianza.
- Visualmente usa Soft Tech B2B: fondo crema cálido, verde institucional, bordes suaves, cards limpias, botones pill, grid sutil en hero.
- Lo fuerte: foco For3s QA, 4 entregables correctos, FAQ comercial, claims prudentes.
- Lo débil: falta demostrar más el producto; todavía se siente conceptual; falta una pieza visual concreta tipo QA Execution Pack / antes-después / piloto.

Dirección visual recomendada para avanzar:

> Producto SaaS moderno + operacional QA, manteniendo sobriedad institucional.

Esto significa que el modo claro debe sentirse menos como consultoría genérica y más como una herramienta real para equipos de producto, ingeniería y QA.

**Regla de avance:** antes de ejecutar cambios visuales, discutir la dirección con Brian. Una vez aprobada, modificar solo el modo claro y verificar con `bun run build`.

### Avance aplicado — HeroLight estilo v1

Brian aprobó mover el modo claro hacia:

> Más tecnología, más del estilo OpenClaw/Hermes, con toques de AaaS y vista a producto QA.

Primera modificación ejecutada:

- Archivo principal: `components/sections/HeroLight.tsx`.
- Se mantuvo el copy principal del hero.
- Se cambió la composición editorial pura a layout con columna izquierda + preview visual de producto.
- Se agregó un mockup visual de **QA Execution Pack** con contexto de entrada, outputs QA, estado de revisión humana y trazabilidad.
- Las etiquetas visibles nuevas se agregaron vía i18n en `messages/es.json` y `messages/en.json`.
- No se tocó modo oscuro.

Corrección posterior de Brian:

- El overline del hero debía decir solo **For3s QA**, no `For3s QA · B2B Light`.
- El preview visual no debía forzar scroll ni fricción responsive.
- Ajuste aplicado: el preview de producto ahora tiene dos comportamientos:
  - Mobile/tablet: preview compacto debajo del CTA.
  - Laptop/desktop desde `lg`: texto y preview compacto lado a lado.
- Se cambió el hero a `items-start` por defecto y `2xl:items-center` para evitar el gran vacío superior en pantallas pequeñas.
- Se compactó el ritmo vertical del hero para que los botones queden visibles sin micro-scroll en resoluciones medianas.
- Se limpió `.next/dev` para resolver `ChunkLoadError`/404 de Turbopack dev cache.

Validación posterior:

```bash
bun run lint   # pass
bun run build  # pass
```

Verificación visual local:

- Dev server limpio en `http://localhost:3000/`.
- Capturas revisadas con Chromium headless en 390x844 y 1366x768 tras el ajuste final.
- Resultado: mobile conserva preview abajo; laptop muestra texto y preview lado a lado; CTAs visibles.

### Avance aplicado — Navbar responsive v1

Problema reportado por Brian:

- El nav no era responsive y se veía desalineado.
- En pantallas medianas/tablet se amontonaba la navegación central con el cluster derecho.

Ajuste ejecutado:

- Archivo principal: `components/shared/Navbar.tsx`.
- Se corrigió el breakpoint del nav: la navegación central aparece desde `lg`, no desde `md`.
- El hamburger permanece visible hasta `lg`, para que tablets y pantallas medianas usen drawer en lugar de nav apretado.
- El CTA derecho se envolvió en un contenedor `hidden lg:inline-flex` porque `btn-pill` usa `display: inline-flex` y estaba anulando `hidden`.
- Los links centrales usan `whitespace-nowrap` para evitar saltos de línea en desktop.
- En modo claro se quitó `demo` del grupo central de links para no duplicar `Book demo`; la acción principal queda solo como CTA derecho.
- No se cambió el contenido del modo oscuro; solo se mejoró el comportamiento responsive compartido del navbar.

Validación posterior:

```bash
bun run lint   # pass
bun run build  # pass
```

Verificación visual local:

- Capturas revisadas con Chromium headless en 390x844, 768x900 y 1366x768.
- Resultado: mobile/tablet muestran logo + idioma + tema + hamburger sin CTA apretado; desktop muestra links centrados y CTA derecho alineado.

### Avance aplicado — AboutLight / Problem v3

Dirección aprobada:

- Después de Hero/Nav, avanzar con `AboutLight`, correspondiente al link **Problema**.
- Convertir la sección en una composición visual de alto impacto, no en una sección editorial genérica.
- Mantener responsivo para cualquier dispositivo y aplicar criterios de Impeccable: jerarquía clara, ritmo espacial, adaptación real por breakpoint y no solo escalado.
- Brian pidió evitar que se viera igual al hero y reducir lectura: debe enganchar con la mirada.

Ajuste ejecutado:

- Archivo principal: `components/sections/About.tsx`.
- Solo se modificó `AboutLight`; `AboutDark` se mantuvo intacto.
- La versión inicial tipo `Problem scan` fue reemplazada porque repetía demasiado el lenguaje visual del hero.
- La versión **Antes / Con For3s QA** también fue descartada por sentirse demasiado card/comparativa.
- La sección ahora usa formato **Fractura de contexto**:
  - piezas sueltas: Ticket, Chat, Docs, Criterios, Bug;
  - nodo central: For3s QA ordena contexto;
  - outputs visuales: Casos claros, Criterios revisables, Vacíos visibles.
- Se redujo el copy a dos frases cortas.
- Se agregó una leyenda para recuperar el matiz original: no es falta de pruebas, es falta de contexto compartido.
- Se quitaron paneles tipo dashboard, columnas comparativas y pasos largos.
- Se mantuvo un icono mínimo de `lucide-react` para outputs.
- Se actualizaron textos en `messages/es.json` y `messages/en.json`.

Validación posterior:

```bash
bun run lint   # pass
bun run build  # pass
git diff --check # pass
```

Nota de verificación visual:

- El build de producción pasó.
- En este entorno, las capturas headless previas salieron en blanco aunque Next respondía; no usarlas como evidencia visual.

### Decisión de tipografía — Aeonik-like legal

Referencia aprobada por Brian:

- `https://core.app/tools`
- Lo que gustó: fuente tipo Aeonik, sensación de producto serio, ecosistema organizado, herramienta útil, claridad sin sobreexplicar y tecnología accesible.

Estado real:

- Core usa `Aeonik` para títulos/cards e `Inter` para texto secundario.
- `Aeonik` es una fuente comercial de CoType Foundry; no se debe copiar desde Core ni descargar de fuentes no oficiales.
- En el repo no hay archivos `Aeonik .woff2/.woff`.

Ajuste ejecutado:

- Archivo: `app/[locale]/layout.tsx`.
- Se integró `Space_Grotesk` desde `next/font/google` como alternativa legal cercana a Aeonik para headings.
- Archivo: `app/globals.css`.
- `--font-heading` usa `var(--font-heading-face), "Aeonik", var(--font-sans)`.
- `h1`-`h6` usan `var(--font-heading)`.
- Brian pidió un trazo un poco más grueso; se aplicó `font-weight: 650` global para headings.
- Resultado esperado: headings con sensación más geométrica/producto, cuerpo mantiene Inter para legibilidad.

Para activar Aeonik real:

- Comprar/usar licencia web válida.
- Agregar archivos `.woff2` licenciados al repo.
- Integrar con `next/font/local` o `@font-face` apuntando a esos archivos.

Validación:

```bash
bun run lint   # pass
bun run build  # pass
```

### Avance aplicado — ProjectsLight / Ecosystem v1

Dirección aprobada:

- Brian pidió convertir Godinez AI, AgentCamp, Vibecoding Bootcamp, Mi Pase, Paykit, AteneaIO y otros en un carrete automático tipo sponsors/logos, pero usando proyectos realizados.
- La sección debía sentirse más cercana a Core Tools: producto serio, ecosistema organizado, herramienta útil y claridad sin sobreexplicar.

Ajuste ejecutado:

- Archivo principal: `components/sections/Projects.tsx`.
- Solo se modificó `ProjectsLight`; `ProjectsDark` se mantuvo intacto.
- El header cambió a una idea más directa: **Un ecosistema antes que una promesa**.
- Se reemplazó el bloque contextual grande por tres módulos compactos:
  - Producto;
  - Comunidad;
  - Operación.
- Los proyectos ahora aparecen en un carrusel horizontal automático e infinito:
  - duplica items para loop continuo;
  - pausa en hover;
  - mantiene links externos para Paykit y AteneaIO;
  - usa cards compactas con tipo, nombre y descripción corta.
- Se agregó animación CSS `projects-marquee`.
- Se actualizaron textos en `messages/es.json` y `messages/en.json`.

Validación:

```bash
bun run lint   # pass
bun run build  # pass
```

### Avance aplicado — SkillsLight / QA Pack v1

Dirección aprobada:

- Brian pidió que la sección posterior a Ecosystem fuera visualmente fuerte porque ya había suficiente texto.
- La idea aprobada fue convertir `SkillsLight` en **QA Pack generado**, no una lista de skills genéricas.

Ajuste ejecutado:

- Archivo principal: `components/sections/Skills.tsx`.
- Solo se modificó `SkillsLight`; `SkillsDark` se mantuvo intacto.
- La sección ahora tiene:
  - headline y explicación breve a la izquierda;
  - panel central **QA Execution Pack**;
  - seis nodos visuales alrededor: Casos de prueba, Criterios de aceptación, Preguntas faltantes, Edge cases, Trazabilidad, Revisión humana.
- Se agregaron iconos de `lucide-react` para que cada output sea reconocible sin leer demasiado.
- Se actualizaron textos en `messages/es.json` y `messages/en.json`.

Validación:

```bash
bun run lint   # pass
bun run build  # pass
```

### Avance aplicado — TimelineLight / Operating Model v1

Dirección aprobada:

- Convertir `TimelineLight` en una sección de confianza/infraestructura.
- Responder visualmente: cómo For3s QA mejora QA sin quitar control sobre contexto, decisiones ni revisión humana.

Ajuste ejecutado:

- Archivo principal: `components/sections/Timeline.tsx`.
- Solo se modificó `TimelineLight`; `TimelineDark` se mantuvo intacto.
- La sección ahora usa formato **Operating Model**:
  - izquierda: headline, subcopy y frase de cierre;
  - derecha: panel central **Controlled agent workflow**;
  - alrededor: Workspaces privados, Revisión humana, Sin entrenamiento sin permiso, Contexto trazable, Pilotos acompañados.
- El bloque **For3s OS** se convirtió en una banda compacta bajo el panel.
- Se agregaron iconos de `lucide-react` para reforzar seguridad, revisión, control y trazabilidad.
- Se actualizaron textos en `messages/es.json` y `messages/en.json`.

Validación:

```bash
bun run lint   # pass
bun run build  # pass
```

### Decisión — FaqLight se conserva como estaba

Se probó una dirección `Buyer Questions` para `FaqLight`, pero Brian pidió regresar al formato anterior.

Estado final:

- `FaqLight` volvió a usar `FaqLayout`.
- Se restauró el copy anterior en `messages/es.json` y `messages/en.json`.
- `FaqDark` no fue modificado.

Validación posterior:

```bash
bun run lint   # pass
bun run build  # pass
```

---

## 5. Audiencias (4 contextos co-primarios)

Resumen denso de PRODUCT.md §Users. Para detalle completo, leer PRODUCT.md directo.

```
   CONTEXTO 1 — Evaluación empresarial (B2B Light) · CO-PRIMARIO
   ────────────────────────────────────────────────────────────
   Equipo técnico de empresa mediana/grande con presupuesto AI.
   Necesita: casos reales, claridad técnica, sensación empresa establecida.
   Pierde por: copy "transform your business", ausencia de números.

   CONTEXTO 2 — Builder nocturno (B2C Dark) · CO-PRIMARIO
   ────────────────────────────────────────────────────────────
   Founder/dev LATAM construyendo con agentes.
   Necesita: pattern aplicable esta noche, gente real en español.
   Pierde por: "request a demo", gated content, condescendencia.

   CONTEXTO 3 — Curioso no-técnico (B2C Light)
   ────────────────────────────────────────────────────────────
   PM/marketer LATAM por recomendación.
   Necesita: mapa mental en 30 segundos sin sentirse estúpido.
   Pierde por: jerga kubernetes en hero, asumir conocimiento previo.

   CONTEXTO 4 — Comprador serio listo (B2B Light)
   ────────────────────────────────────────────────────────────
   Ya visitó antes. Vuelve a contratar/agendar.
   Necesita: fricción mínima para conectar.
   Pierde por: formulario largo, "we'll get back in 48hrs".
```

---

## 6. Estado real del sitio (snapshot AUDIT.md 2026-05-11)

```
ESTADO GENERAL:    ✅ Production-ready con pulidos menores
DEUDA CRÍTICA:     ❌ No detectada

TOTAL FINDINGS:    4
   ●  HIGH:        0
   ●  MED:         2  ◄── pendientes de fix
   ●  LOW:         2  ◄── pendientes de fix

CATEGORÍAS AUDITADAS:
   ✅ brand-bold coherence       PASS (zero hardcoded colors)
   ⚠️  copy alignment             1 MED (palabra "leverage" en en.json)
   ⚠️  typographic hierarchy      1 MED + 1 LOW
   ✅ i18n key coherence          PASS (paridad total ES/EN)
```

### Findings pendientes (orden recomendado)

| # | Severidad | Findings | Archivo |
|---|---|---|---|
| 1 | MED | Escala H3 → H4 rota (3.0x vs 1.25x mínimo) | `components/sections/Projects.tsx` |
| 2 | MED | Palabra anti-referencia "leverage" en Docs entry | `messages/en.json` |
| 3 | LOW | Ratio H2 → H3 frágil en breakpoint `sm` (1.0x en tablet) | `components/sections/Projects.tsx` |
| 4 | LOW | Hero "Founder" vs Site "CEO" inconsistencia menor | `messages/{es,en}.json` |

**Flag importante:** Brian dijo "regla de oro: no modificar textos sin permiso" → finding #2 está flagged, NO aplicado.

---

## 7. Reglas no-negociables (cómo conversar con Brian en este repo)

```
   ✗ NO modificar textos del sitio sin permiso explícito
      Razón: regla de oro establecida por Brian, todos los copy van validados
   
   ✗ NO modificar PRODUCT.md ni DESIGN.md sin confirmación
      Razón: cambiarlos cambia el "norte" del skill impeccable
   
   ✗ NO hacer commits a git sin pedirlo
      Razón: confirmar antes de tocar historia git
   
   ✗ NO instalar dependencias nuevas sin justificar
      Razón: el stack está LOCKED, agregar tiene costo
   
   ✗ NO romper la dualidad B2B Light / B2C Dark
      Razón: es decisión estratégica, no preferencia
   
   ✗ NO usar colores hardcoded (text-amber-*, hex en className)
      Razón: AUDIT.md ya validó cero hardcoded, mantenerlo así
   
   ✗ NO marketing language, NO floreo, NO em-dashes
      Razón: regla de voz editorial-técnica
   
   ✗ NO anglicismos prohibidos: leverage, empower, unlock
      Razón: PRODUCT.md los lista explícitamente
   
   ✗ NO asumir Next.js que conoces
      Razón: Next 16 cambió APIs vs training data
   
   ─────────────────────────────────────────────────────
   
   ✓ SÍ honestidad técnica brutal (regla explícita Brian)
   ✓ SÍ usar tokens semánticos del design system
   ✓ SÍ verificar contra DESIGN.md y PRODUCT.md
   ✓ SÍ respetar dualidad Light=B2B / Dark=B2C
   ✓ SÍ preguntar ante duda
   ✓ SÍ leer node_modules/next/dist/docs/ antes de tocar Next 16
   ✓ SÍ ejecutar skill impeccable para tareas de diseño
   ✓ SÍ leer Mente/Doc/Impeccable_Workflow.md antes de tocar UI/UX
   ✓ SÍ usar bun para comandos del proyecto (`bun run lint`, `bun run build`)
   ✓ SÍ documentar cambios importantes en Mente/Cuerpo/ o aquí
```

---

## 8. Relación con el resto del universo For3s

**NO duplicar contexto que vive en otros repos.** Solo apuntar.

```
   ╔══════════════════════════════════════════════════════════╗
   ║   /home/brianweb3/for3s/Mente/                            ║
   ║      → Plataforma For3s OS (segundo cerebro universal)    ║
   ║      → 11 nodos cerebrales, Grafo Maestro                  ║
   ║      → Rondas R1-R10 técnicas (en R3 actualmente)          ║
   ║      → Estado: R1 ✅, R2 ✅, R3 B1 ✅, R3 B2 ✅            ║
   ║      → NO es scope de este repo. Solo referencia.          ║
   ║                                                            ║
   ╠══════════════════════════════════════════════════════════╣
   ║                                                            ║
   ║   /home/brianweb3/for3s/for3s-inter/                       ║
   ║      → Company OS (operación LOCKED)                       ║
   ║      → Decisiones D-001...D-013                            ║
   ║      → For3s QA wedge comercial                            ║
   ║      → NO es scope de este repo. Solo referencia.          ║
   ║                                                            ║
   ╠══════════════════════════════════════════════════════════╣
   ║                                                            ║
   ║   /home/brianweb3/for3s/marca-personal/  ◄── ESTE          ║
   ║      → Sitio público                                       ║
   ║      → Refleja lo LOCKED de los otros dos                  ║
   ║      → Mente/ local (este nuevo) gobierna el SITIO         ║
   ║                                                            ║
   ╚══════════════════════════════════════════════════════════╝
```

**Anclas LOCKED globales For3s** (sin duplicarlas — sólo referencia):
- 1.D Dedicated SaaS
- 2.B Open Core
- 3.D Equipo pequeño

Detalle vive en `/home/brianweb3/for3s/Mente/Doc/Estado_Sesion_Continuidad.md`. **Si el sitio necesita comunicar algo de la plataforma, leer ahí primero.**

---

## 9. Próximo paso esperado en este repo

**Estatus:** sitio production-ready con 4 findings menores pendientes. `bun run lint` y `bun run build` pasan al 2026-06-03 despues de excluir `.claude/**` del lint y corregir warnings propios.

**Decisiones pendientes (Brian debe confirmar para avanzar):**

```
   1. ¿Fix de los 2 findings MED de AUDIT.md?
      • Si sí → priorizar #1 (H3→H4 en Projects.tsx)
      • #2 (leverage en en.json) requiere permiso explícito Brian
   
   2. ¿Refresh AUDIT.md? (última corrida 2026-05-11, ~3 semanas atrás)
   
   3. ¿Validar las 3 preguntas pendientes del README §8?
      • ¿Mente/ local sincroniza con Mente/ principal?
      • ¿Estado_Sesion duplica anclas o solo apunta?
      • ¿PRODUCT.md / DESIGN.md eventualmente migran a Mente/Cerebro/?
   
   4. ¿Algún feature/sección nueva planeada?
      • Si sí → arrancar plan en Mente/Cuerpo/
   
   5. ¿Algún análisis pendiente?
      • Si sí → arrancar en Mente/Cerebro/

   6. ¿La tarea toca UI/UX/diseño?
      • Si sí → leer Mente/Doc/Impeccable_Workflow.md
      • Declarar IMPECCABLE_PREFLIGHT antes de editar interfaz
```

---

## 10. Checklist de retomada (10 ítems)

Cuando un agente retoma trabajo en este repo, debe poder responder estas 10 preguntas:

```
   [ ]  1. ¿Cuál es la última fecha registrada en este Estado_Sesion?
   [ ]  2. ¿El sitio está production-ready hoy?
   [ ]  3. ¿Cuántos findings hay pendientes y de qué severidad?
   [ ]  4. ¿Qué versión de Next.js usamos y qué implica?
   [ ]  5. ¿Cuál es la regla de oro de Brian sobre textos?
   [ ]  6. ¿Cómo se resuelve el dual-mode B2B/B2C en código?
   [ ]  7. ¿Dónde vive el source of truth de contenido?
   [ ]  8. ¿Qué skill IA está instalado y cuál es su rol?
   [ ]  9. ¿Cuál es la relación entre este Mente/ y /for3s/Mente/?
   [ ] 10. ¿Cuál es el próximo paso esperado por Brian?
```

**Si no puedes responder las 10, vuelve a leer este documento y los archivos linkeados.**

---

## 11. Bitácora de cambios importantes

| Fecha | Cambio | Owner |
|---|---|---|
| 2026-06-03 | Regla operativa nueva: `marca-personal` usara `impeccable` como protocolo obligatorio para tareas UI/UX/diseno. Se creo `Mente/Doc/Impeccable_Workflow.md`, se documento instalacion local y se establecio `bun run lint` + `bun run build` como verificacion posterior. | Brian + Codex |
| 2026-06-03 | Correccion tecnica: `bun run lint` y `bun run build` pasan en `marca-personal`. Cambios: excluir `.claude/**` de ESLint, usar `useTheme()` en `ThemeToggle`, simplificar shortcut label en Docs search, quitar import `Zap` no usado. | Brian + Codex |
| 2026-06-03 | Creación de `Mente/MANUAL_USO_IA.md` — manual operativo para Claude/Codex/GPT/futuros agentes. Define cuándo y cómo escribir en cada capa, plantillas, coexistencia con skill impeccable, casos especiales. Memoria global actualizada con ruta correcta del repo y referencia a `Mente/` local. | Brian + Claude |
| 2026-06-03 | Creación de estructura `Mente/{Alma,Cerebro,Cuerpo,Doc}/` en este repo (réplica de `/for3s/Mente/`). README maestro + Estado_Sesion inicial. Coexiste con skill impeccable sin tocarlo. | Brian + Claude |
| 2026-05-30 | Última actualización de README raíz del repo | Brian |
| 2026-05-18 | Última modificación general del repo (.git timestamp) | Brian |
| 2026-05-11 | AUDIT.md generado — 4 findings (0 HIGH, 2 MED, 2 LOW) | Brian + Claude |
| 2026-05-11 | DESIGN.md establecido (640 líneas) | Brian + Claude |
| 2026-05-11 | PRODUCT.md establecido (313 líneas) — dual-mode foundation | Brian + Claude |
| 2026-05-05 | Skill impeccable instalado en `.claude/skills/` | Brian |
| 2026-05-04 | Genesis del repo (primer commit Next.js) | Brian |

---

## 12. Si tienes dudas

**Antes de modificar cualquier cosa en este repo, pregunta a Brian.**

Brian prefiere:
- Honestidad técnica brutal sobre cortesía vacía
- Preguntas específicas sobre suposiciones generales
- "No sé, ¿me ayudas a entender?" sobre "voy a asumir X"
- Confirmación antes de mutación sobre disculpa después

---

**Fin de Estado_Sesion_Continuidad.md del repo `marca-personal/`.**

**Si has leído esto completo, ya tienes lo necesario para continuar con Brian sin perder contexto.**
