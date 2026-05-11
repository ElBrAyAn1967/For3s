---
name: For3s
description: Soft Tech B2B (verde institucional #174023) meets Deep Tech B2C (ámbar builder #EF9B11). Dos modos, dos colores de identidad. El token `--brand-bold` resuelve la elección por modo.
colors:
  # Brand — Dark/B2C identity (ámbar builder)
  ambar: "#f5b820"
  ambar-hover: "#e5a910"

  # Brand — Light/B2B identity (verde institucional)
  verde: "#174023"
  verde-hover: "#1d5230"

  # Light mode (Soft Tech B2B) — verde institucional #174023
  hueso: "#fff9ef"
  hueso-alt: "#F0F0EE"
  surface-light: "#FFFFFF"
  obsidiana: "#111111"
  antracita: "#1A1A1A"
  muted-light: "#666666"
  border-light: "#E5E7EB"

  # Dark mode (Deep Tech B2C) — ámbar builder #EF9B11
  obsidiana-deep: "#0B0C10"
  bg-alt-dark: "#111218"
  surface-dark: "#16181D"
  elevated-dark: "#1E2128"
  silver: "#E2E2E6"
  blanco: "#F8F8F8"
  muted-dark: "#888B96"
  border-dark: "#23262D"

  # Status accents (ambos modos)
  success: "#10b981"
  success-bright: "#4ade80"
  danger: "#ef4444"

typography:
  kicker:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  hero:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  h2:
    fontFamily: "Inter, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "-0.01em"
  small:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  mono-tag:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.02em"

rounded:
  sm: "6px"
  md: "12px"
  lg: "20px"
  xl: "24px"

spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  2xl: "80px"
  3xl: "120px"

zIndex:
  base: 0
  decor: 1
  content: 10
  sticky: 30
  nav: 50
  modal-overlay: 90
  modal: 100
  tooltip: 110

components:
  # Botón primary ámbar (CTA principal en ambos modos)
  button-primary:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.obsidiana}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.ambar-hover}"

  # Botón secundario light (outline antracita)
  button-secondary-light:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.obsidiana}"
    rounded: "{rounded.md}"
    padding: "14px 28px"

  # Botón secundario dark (ghost silver)
  button-secondary-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.silver}"
    rounded: "{rounded.md}"
    padding: "14px 28px"

  # Bento card light
  card-light:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.antracita}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  # Bento card dark
  card-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.silver}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  # Tag mono ámbar
  tag-ambar:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.obsidiana}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
    typography: "{typography.mono-tag}"

  # Tag mono neutral
  tag-neutral-light:
    backgroundColor: "{colors.hueso-alt}"
    textColor: "{colors.antracita}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
    typography: "{typography.mono-tag}"
  tag-neutral-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.silver}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
    typography: "{typography.mono-tag}"
---

## Overview

For3s opera dos modos visuales según contexto y audiencia:

- **Soft Tech (light mode)** — para B2B institucional. Fondos crema cálido (`#fff9ef`, oklch 0.984 0.015 80°), bento cards en escalas tinted del mismo hue, espacios amplios. Transmite calidez orgánica y autoridad serena — NO un blanco frío de SaaS.
- **Deep Tech (dark mode)** — para B2B, CTOs, ingenieros. Obsidiana profunda (`#0B0C10`) con tinte azul-espacial, ámbar como láser de precisión. Transmite potencia, escalabilidad, rigor.

El **ámbar `#f5b820`** es el ADN cruzado de For3s. Ya no es alerta industrial: en light actúa como "luz solar" guiando al usuario hacia conversión; en dark se convierte en "láser" que brilla por contraste sobre obsidiana.

**Modelo Bento Box**: tarjetas modulares con `border-radius: 20px`, padding generoso (`32px`), sombras tenues en light (`0 4px 20px rgba(0,0,0,0.03)`), bordes finos en dark (`1px solid #23262D`) — sin sombras oscuras sobre oscuro. Reduce carga cognitiva: la infraestructura se siente como armar bloques de Lego.

**Width principal**: 1140px max. Espaciado: escala 8/16/24/32/48/80/120px.

**Dualidad B2C/B2B controlada**: visualmente todo es Soft (white space, redondez), textualmente se inyecta autoridad mediante JetBrains Mono en kickers, tags, stats y status pills.

## Colors

### Brand — Dos identidades, una marca

For3s usa **dos colores de identidad** según modo. Se resuelven en código vía el token theme-aware `--brand-bold`:

| Token | Hex | Resuelve a | Rol |
|---|---|---|---|
| `--brand-bold` (Light) | `#174023` | `--c-green-30` | Color de identidad B2B institucional |
| `--brand-bold` (Dark) | `#EF9B11` (eq) | `--c-brand-70` | Color de identidad B2C builder |
| `--brand-bold-hover` (Light) | — | `--c-green-40` | Hover state CTA primary en Light |
| `--brand-bold-hover` (Dark) | — | `--c-brand-80` | Hover state CTA primary en Dark |

#### Verde For3s — Light B2B (`#174023`)

| Token | Hex | Rol |
|---|---|---|
| `c-green-30` | `#174023` | Color brand-bold en Light, CTAs primary, logo, overlines |
| `c-green-40` | `#1d5230` (eq) | Hover state, decorative accents |
| `c-green-100` | `#d4ecd5` (eq) | Background tinted muy claro |

Verde institucional profundo (hue 145-150°). Función emocional: **autoridad cálida sin agresividad**. Tradición visual: capital institucional, fondos clásicos, instituciones académicas. Comunica seriedad sin perder cordialidad.

#### Ámbar For3s — Dark B2C (`#EF9B11`)

| Token | Hex (aprox) | Rol |
|---|---|---|
| `c-brand-70` | `#EF9B11` | Color brand-bold en Dark, CTAs primary, logo, overlines |
| `c-brand-80` | hover state | Hover decorative |
| `c-brand-5` → `c-brand-100` | escala completa | Backgrounds tinted, surfaces, hovers |

Ámbar dorado (hue 60°). Función emocional: **láser de precisión** sobre obsidiana. Comunica energía técnica controlada.

#### Regla cruzada

- **Verde nunca aparece en Dark mode.** El ámbar nunca aparece en Light mode (excepto el banner del modal con `--marketing-gradient` que cambia su gradient por modo).
- **Ningún componente consume `c-green-*` o `c-brand-*` directo.** Siempre usar `--brand-bold` (theme-aware) o `--foreground-accent` (theme-aware).
- **Excepción documentada:** los tokens decorativos `c-brand-*` siguen activos en componentes específicos del modal banner cuando se necesita un gradient hardcoded ámbar (legacy). En light el marketing-gradient se sobreescribe a versión verde.

### Light Mode — Soft Tech (B2B)

| Token | Hex | Rol |
|---|---|---|
| `hueso` | `#fff9ef` | Background canvas. Crema cálido (hue 80°, chroma 0.015) — NO blanco puro, NO frío. Transmite calidez orgánica y autoridad serena |
| `hueso-alt` | `#F0F0EE` | Background alternado para secciones |
| `surface-light` | `#FFFFFF` | Bento cards, modales, popovers (única superficie blanco puro) |
| `obsidiana` | `#111111` | Headings — peso máximo |
| `antracita` | `#1A1A1A` | Body text — gris muy profundo, no negro puro |
| `muted-light` | `#666666` | Secondary text, captions, disabled |
| `border-light` | `#E5E7EB` | Bordes de cards, dividers, inputs |

### Dark Mode — Deep Tech (B2C)

| Token | Hex | Rol |
|---|---|---|
| `obsidiana-deep` | `#0B0C10` | Background base. Tinte azul/espacial, NO negro puro |
| `bg-alt-dark` | `#111218` | Capa de contraste, secciones alternadas |
| `surface-dark` | `#16181D` | Bento cards |
| `elevated-dark` | `#1E2128` | Hovers, modales, dropdowns elevados |
| `blanco` | `#F8F8F8` | Headings — NO `#fff` puro (causa "sangrado" visual) |
| `silver` | `#E2E2E6` | Body text — legibilidad premium en sesiones largas |
| `muted-dark` | `#888B96` | Secondary text, captions |
| `border-dark` | `#23262D` | Bordes finos como única separación (no shadows) |

### Status (compartidos)

| Token | Hex | Rol |
|---|---|---|
| `success` | `#10b981` | Éxito, "Mejores prácticas", checks |
| `success-bright` | `#4ade80` | Status pills, dots de OPERATIONAL |
| `danger` | `#ef4444` | Errores, "Evitar a toda costa" |

### Reglas de aplicación

- **OKLCH cuando se pueda**: el código vive en OKLCH para transición clara/oscuro coherente; los hex de arriba son los anclajes canónicos.
- **Reduce chroma en extremos**: cerca de lightness 0 o 100, baja chroma — alta saturación en extremos se ve garish.
- **Tinte sutil de neutros hacia el brand hue**: nunca neutros puros (`#000`/`#fff`). Tintar ligeramente hacia ámbar/azul para coherencia.

## Typography

### Familias

- **`Inter`** — primary. Variable, optical sized. Limpia, neutra, ultra-legible. Humaniza con rigor métrico. Pesos en uso: 400 / 500 / 600 / 700 / 800.
- **`JetBrains Mono`** — accent. Para detalles técnicos: kickers, tags, números, status, code inline, stats. NO para body. Crea contraste B2B implícito sin romper la cordialidad B2C.

> **Activaciones OpenType**: Inter en producción usa `font-feature-settings: "cv11" on` — alternate single-storey 'a' (look Modal-inspired). Aplicado globalmente en `body` desde `globals.css`. Si en el futuro un cliente B2B reporta que la 'a' alternate "se ve casual", la regla se puede sobrescribir en superficies específicas: `font-feature-settings: normal`.

> **Reflex-reject del skill `impeccable`**: Inter aparece en la training-data defaults list. La decisión de For3s es **mantener Inter** como defensa explícita basada en PRODUCT.md ("limpia, neutra, ultra-legible. Humaniza con rigor métrico") y el contexto LATAM (penetración alta, soporte i18n excelente). NO cambiar Inter sin actualizar PRODUCT.md primero.

### Escala (semantic)

| Rol | Familia | Tamaño | Peso | Letter-spacing | Line-height | Uso |
|---|---|---|---|---|---|---|
| **kicker** | JetBrains Mono | 13px | 600 | `0.05em` UPPERCASE | 1.2 | Eyebrow técnico ("INFRAESTRUCTURA DE AGENTES") |
| **hero** | Inter | `clamp(2.5rem, 7vw, 4.5rem)` (40-72px) | 800 | `-0.04em` (tight) | 1.05 | H1 hero |
| **h2** | Inter | 32px | 700 | `-0.03em` | 1.25 | Section titles |
| **h3** | Inter | 24px | 600 | `-0.02em` | 1.3 | Subsections, card titles |
| **body** | Inter | 18px (mobile 17px) | 400 | `-0.01em` | 1.7 | Cuerpo principal |
| **small** | Inter | 15px | 400 | `-0.01em` | 1.6 | Captions, descriptions cortas |
| **mono-tag** | JetBrains Mono | 12px | 500 | `0.02em` | 1 | Tags, badges, status code |

### Reglas críticas

- **Optical kerning global**: `letter-spacing: -0.01em` en `body` para lectura fluida — esto es **firma For3s**.
- **Tight kerning corporativo**: `-0.04em` en hero, `-0.03em` en H2 → look "OpenAI/Vercel/Stripe".
- **Tracking positivo en mono**: el mono SIEMPRE positivo (`0.02em` o `0.05em` UPPERCASE), nunca negativo.
- **Acento ámbar en H1**: una palabra/frase coloreada `#f5b820`, el resto en obsidiana/blanco. Patrón canónico: "Orquestación / **sin límites.**" (el ámbar termina la frase con el punto final).

## Elevation

For3s usa **elevación dual** según el modo:

### Light mode — sombras sutiles

```css
/* Card en reposo */
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

/* Hero card / sección destacada */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);

/* CTA primary ámbar */
box-shadow: 0 4px 14px rgba(245, 184, 32, 0.3);

/* CTA primary ámbar hover */
box-shadow: 0 6px 20px rgba(245, 184, 32, 0.4);
transform: translateY(-1px);

/* Section-note (left-bordered) */
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
```

Las sombras en light son **casi imperceptibles** (alpha 0.02-0.03). Su rol es solo separar surface blanca de canvas hueso, no dramatizar.

### Dark mode — sin sombras, solo bordes

> **Regla crítica**: **NO usar sombras oscuras sobre fondo oscuro.** No funcionan visualmente y oscurecen aún más.

En dark, separación = `1px solid #23262D` (border). Hover sutil = lighten del border a `#353945`. El ámbar brilla por contraste directo, no necesita glow para destacar.

```css
/* Card dark */
border: 1px solid #23262D;
transition: border-color 0.3s ease;

/* Card dark hover */
border-color: #353945;

/* CTA primary ámbar dark */
/* SIN box-shadow. El brillo viene del contraste. */
```

## Components

### Button — Primary (Ámbar)

CTA universal. Lleva al usuario a la conversión principal: "Empezar a construir", "Deploy Infrastructure", "Sumarme".

```css
.btn-primary {
  font-family: Inter;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
  background: #f5b820;
  color: #111111;        /* obsidiana en ambos modos */
  border-radius: 12px;
  padding: 14px 28px;
  transition: all 0.2s ease;
}

/* Light mode */
.btn-primary {
  box-shadow: 0 4px 14px rgba(245, 184, 32, 0.3);
}
.btn-primary:hover {
  background: #e5a910;
  box-shadow: 0 6px 20px rgba(245, 184, 32, 0.4);
  transform: translateY(-1px);
}

/* Dark mode */
.dark .btn-primary {
  /* sin shadow */
}
.dark .btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

**Tamaños**:
- `sm` — 14px font, padding 10px 20px
- `md` (default) — 16px font, padding 14px 28px
- `lg` — 18px font, padding 16px 32px

### Button — Secondary

Soporta acciones tipo "Leer la Documentación", "Technical Docs", "Agendar demo". Outline en light, ghost en dark.

```css
/* Light: outline antracita */
.btn-secondary-light {
  background: transparent;
  color: #111111;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px 28px;
}
.btn-secondary-light:hover {
  border-color: #1A1A1A;
}

/* Dark: ghost silver */
.dark .btn-secondary {
  background: transparent;
  color: #E2E2E6;
  border: 1px solid #23262D;
}
.dark .btn-secondary:hover {
  background: #1E2128;
  border-color: #888B96;
}
```

### Card — Bento (cualquier modo)

Unidad básica de contenido. Modular, padding generoso, redondeado.

```css
.card {
  border-radius: 20px;
  padding: 32px;
  /* el rest cambia según modo */
}

/* Light */
.card { background: #FFFFFF; border: 1px solid #E5E7EB; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }

/* Dark */
.dark .card { background: #16181D; border: 1px solid #23262D; }
.dark .card:hover { border-color: #353945; }
```

**Card-title interno** (kicker mono dentro de card):

```css
.card-title {
  font-family: JetBrains Mono;
  font-size: 14px;
  font-weight: 700;
  color: #666666; /* light */ // dark: #888B96
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 18px;
}
```

### Section-note — callout con border-left ámbar

Caja para definiciones, reglas, observaciones clave dentro de una sección.

```css
.section-note {
  background: #FFFFFF;       /* light */ // dark: #16181D
  border-left: 3px solid #f5b820;
  padding: 16px 24px;
  border-radius: 0 12px 12px 0;
  font-size: 16px;
  color: #666666;            /* muted */ // dark: #888B96
  line-height: 1.7;
  /* Light only */
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.section-note strong {
  color: #111111; /* obsidiana */ // dark: #F8F8F8 (blanco)
  font-weight: 700;
}
```

### Tag — mono pill

Tipografía monospace siempre. Dos variantes principales:

```css
/* Tag ámbar — para destacar el primer item, status, "FOR3S v2.0 LIVE" */
.tag-ambar {
  font-family: JetBrains Mono;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  background: rgba(245, 184, 32, 0.15);
  color: #b45309;             /* light: ámbar oscuro */
  /* dark: color: #f5b820 */
  border: 1px solid rgba(245, 184, 32, 0.3);
  padding: 4px 10px;
  border-radius: 6px;
}

/* Tag neutral — para tags secundarios */
.tag-neutral {
  /* light: bg #F0F0EE, color #1A1A1A, border #E5E7EB */
  /* dark: bg rgba(255,255,255,0.05), color #E2E2E6, border #23262D */
}
```

### Bullet list — con dot ámbar

```css
.bullet-list li::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f5b820;
  flex-shrink: 0;
  margin-top: 10px;
}
.bullet-list li strong {
  color: #111111; /* light */ // dark: #F8F8F8
  font-weight: 600;
}
```

### Section-label — eyebrow numerado

Aparece arriba de cada sección con número técnico mono + label uppercase.

```css
.section-label {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: #666666;            /* muted */
  border-bottom: 1px solid #E5E7EB;
  padding-bottom: 16px;
  margin-bottom: 28px;
}
.section-label .num {
  font-family: JetBrains Mono;
  font-size: 17px;
  color: #f5b820;
}
```

### Hero pattern — frase con acento

Patrón canónico de For3s:

```html
<p class="kicker">SCALABLE AGENTIC FRAMEWORK</p>
<h1 class="hero">
  Infraestructura robusta para la<br>
  <span class="ambar">siguiente generación de agentes.</span>
</h1>
<p class="body-lead">
  Orquestación multi-agente, grafos de conocimiento y memoria persistente.
</p>
<div class="cta-row">
  <button class="btn-primary">Deploy Infrastructure</button>
  <button class="btn-secondary">Technical Docs</button>
</div>
```

### Status tokens (project state pills)

Theme-aware semantic tokens for project state indicators. **Never hard-code these colors in components** — always reference the token.

```css
/* Success — "Activo" */
--status-success-bg, --status-success-fg, --status-success-border

/* Info — "En desarrollo" */
--status-info-bg, --status-info-fg, --status-info-border

/* Muted — "Pausado" */
--status-muted-bg, --status-muted-fg, --status-muted-border
```

Hues are committed: green family for success, blue family for info, neutral grey for muted. Chroma reduced in light mode for legibility on cream background.

### Pattern tokens (decorative overlays)

Theme-aware tokens for decorative surfaces — keeps decoration consistent across modes without hard-coded rgba.

```css
/* Hero grid pattern (1px lines, masked radial) */
--pattern-grid-fg
  /* light: rgba(0,0,0,0.05) */
  /* dark:  rgba(255,255,255,0.04) */

/* Radial glow over banners (e.g. ConnectModal yellow gradient) */
--surface-glow-radial
  /* light: rgba(255,255,255,0.35) */
  /* dark:  rgba(255,255,255,0.25) */
```

### Z-index system

Stack order is centralized — no `z-[100]` magic numbers in components.

```css
--z-base:          0   /* default */
--z-decor:         1   /* hero spotlight, decorative overlays */
--z-content:       10  /* content above decorations */
--z-sticky:        30  /* docs tabs, mobile drawer toggle */
--z-nav:           50  /* main navbar (fixed top) */
--z-modal-overlay: 90
--z-modal:         100
--z-tooltip:       110
```

## Do's and Don'ts

### Light Mode (Soft Tech)

**✓ Hacer**
- Espacio en blanco abundante — transmite lujo, oxígeno, accesibilidad.
- El ámbar guía la conversión, nunca compite con sí mismo. Un ámbar dominante por viewport.
- Bento cards con sombras casi imperceptibles (`alpha 0.02-0.03`).
- Inter para todo lo humano, JetBrains Mono solo en kickers/tags/stats.
- `letter-spacing: -0.01em` en body para lectura fluida.

**✗ Evitar**
- **NUNCA** capturas de código complejo en la home. La infraestructura se demuestra, no se narra.
- Tipografías sci-fi o estética cyberpunk/hacker.
- Ámbar plano sobre negro puro — efecto "Precaución Industrial" (aviso de obra).
- Saturar texto. Si el lector tiene que pelear, perdimos.
- Sombras dramáticas. Light mode es ligero por definición.

### Dark Mode (Deep Tech)

**✓ Hacer**
- Tipografía monospace en cifras, versiones, datos de sistema, status pills (`OPERATIONAL`, `latency: 14ms`).
- El ámbar es **el elemento más brillante** de la pantalla — siempre.
- Espaciado generoso para transmitir limpieza de código.
- Bordes finos `#23262D` como única separación entre superficies.
- Status pill mono con check verde para señalar sistemas vivos.

**✗ Evitar**
- **NUNCA** `#FFF` puro para body — causa "sangrado" visual. Usar `#E2E2E6` (silver).
- Degradados arcoíris. En dark, el único color brillante es el ámbar.
- Sombras oscuras sobre fondo oscuro — invisibles y degradan.
- `#000` puro como fondo — `#0B0C10` tiene tinte azul que da profundidad espacial.

### Cross-mode

**✓ Mantener consistente**
- El **ámbar** es el ADN — mismo hex en ambos modos.
- Border-radius consistente: `6px` (tags) → `12px` (buttons) → `20px` (cards) → `24px` (hero containers).
- Inter + JetBrains Mono — nunca tres familias.
- Modelo Bento — todo es card, todo es modular.

**✗ Nunca**
- Cambiar el rol del ámbar entre modos. Siempre es CTA primary + acento de éxito + última palabra del H1.
- Mezclar shadows fuertes con borders fuertes. Un modo elige uno.
- Romper la dualidad: simple visualmente / potente textualmente. Si la pantalla está visualmente cargada Y textualmente densa, hay que cortar.

---

<!-- DRAFT v1 — extracted from gemini-code-1778035536801.html (Soft Tech Light) and gemini-code-1778035606913.html (Deep Tech Dark). Pending validation against current code state in app/globals.css. Some token names were normalized for parser compatibility. -->
