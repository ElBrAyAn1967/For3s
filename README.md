# For3s — Brian López

Portafolio personal de Brian López (CEO de For3s, infraestructura para agentes de IA en LATAM).

Construido en colaboración con [Frutero Club](https://frutero.club) y [Godinez Studio](https://godinez.studio).

## Stack

- **Framework**: Next.js 16 (App Router) + Turbopack
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Animation**: Framer Motion
- **Typography**: Inter Variable + Fira Mono (Google Fonts)
- **Package manager**: Bun

## Sistema de diseño

- Dark mode hardcoded (`#181818` ground, OKLCH color space)
- Brand: amarillo dorado For3s (escala custom de 12 pasos)
- Tokens semánticos al estilo Modal: `foreground-*`, `surface-*`, `edge-*`, `icon-*`
- Botones pill con micro-feedback (`scale: 0.97` en `:active`)
- Mouse-tracked spotlight en el Hero
- Section blends con gradients para transiciones suaves entre superficies

## Desarrollo

```bash
bun install
bun dev
```

Abrir [http://localhost:3000](http://localhost:3000).

El contenido es escalable desde [`lib/data.ts`](lib/data.ts) — agregar proyectos, skills, timeline o colaboradores ahí.

## Build

```bash
bun run build
```

## Estructura

```
app/                   # App Router de Next.js
  ├─ layout.tsx        # Fonts globales + metadata
  ├─ page.tsx          # Compone las secciones
  └─ globals.css       # Design system completo
components/
  ├─ sections/         # Hero, About, Projects, Skills, Timeline, Contact
  ├─ shared/           # Navbar, Footer
  └─ ui/               # shadcn primitives
lib/
  └─ data.ts           # Source of truth del contenido
```

## Deploy

Optimizado para Vercel. `bun run build` produce un build listo para CDN.
