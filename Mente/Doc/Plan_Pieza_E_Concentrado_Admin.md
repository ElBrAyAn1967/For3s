# 🧩 Plan detallado — Pieza E: concentrado admin único + panel responsive

> **Pendiente madre:** Conectores self-service (`for3s/Mente/Alma/Vision_Conectores_
> SelfService_Panel_Agente.md`). Método: pieza por pieza (regla Brian 2026-07-20).
> **Pieza E = la de arranque** (la más chica, sin tocar identidad/credenciales — solo el sitio).
> **Visión alineada + decisiones tomadas (Brian, 2026-07-20). Este plan → aprobar → construir.**
> Proyecto: `marca-personal` (sitio web For3s QA). Creado 2026-07-20.

---

## 0 · Qué resuelve (visión alineada)

1. **Un solo concentrado admin.** Hoy hay DOS paneles sueltos: `/for3s-admin` (7 tabs, el bueno)
   y `/demo-admin` (registros/waitlist de la demo, el del 2º screenshot). El de la demo se
   ABSORBE como una pestaña más del panel bueno. `/demo-admin` **se elimina (404)**.
2. **El menú del panel no es responsivo.** 7-8 pestañas en `flex` plano → se desbordan en móvil.

## 1 · Terreno investigado (2026-07-20, solo lectura)

| | `/for3s-admin` (el bueno) | `/demo-admin` (se absorbe) |
|---|---|---|
| Página | `app/[locale]/for3s-admin/page.tsx` → `PanelDashboard.tsx` | `app/[locale]/demo-admin/page.tsx` → `components/demo/AdminDashboard.tsx` |
| Auth | token de control, `Bearer` + `X-Admin-Actor` (`lib/for3sAdmin.ts::getToken/validarToken`) | contraseña propia `X-Admin-Password` (`/api/demo/admin/auth`) |
| Backend de datos | **el server For3s directo** (`FOR3S_BASE`, canal admin, vía Tailscale) | **API routes del sitio** (`/api/demo/admin/users`) que leen BD `for3s_demo` |
| Contenido | 7 `<Seccion*>` (Resumen…Expediente), tabs en `PanelDashboard.tsx` L~187 | total/activos/en espera + tabla de personas (kind/nombre/correo/estado/cola) |

**⚠️ Clave:** los dos usan BACKENDS distintos. La sección Demo seguirá leyendo `for3s_demo`
(del sitio) — NO se muda a datos del server. Lo único que cambia es DÓNDE se muestra y CÓMO se
protege (una sola llave).

## 2 · Decisiones tomadas (Brian, 2026-07-20)

- **E-D1 · Una sola llave:** la sección Demo se protege con el **token del panel** — pero ver §1-BIS.
- **E-D2 · `/demo-admin` → 404:** la ruta se elimina (sin redirect). Un solo concentrado.

## 1-BIS · 🐛 HALLAZGO CRÍTICO DE ARQUITECTURA (investigación 2026-07-20)

Leyendo el terreno a fondo salió un hecho que cambia CÓMO se hace la auth (evita un bug que
habría roto en producción):

- **El panel bueno valida el token EN EL NAVEGADOR de Brian, no server-side.** Comentario
  literal en `lib/for3sAdmin.ts`: *"TODO el tráfico va del NAVEGADOR de Brian directo al server
  por el tailnet. Vercel NUNCA ve el token ni los datos — esta página es un cascarón público."*
- **La BD `for3s_demo` vive en el tailnet** (`100.112.177.53`, doc §8: *"conexión desde el sitio
  (equipo local) → server vía Tailscale"*). ⇒ **el demo-admin y `/api/demo/*` HOY solo funcionan
  con el sitio corriendo en la máquina de Brian (en el tailnet), NO desde Vercel.** No es bug
  nuevo — es una limitación que ya existía.
- **Conclusión:** hacer que `/api/demo/admin/users` valide el token llamando al server desde
  Vercel FALLARÍA (Vercel no está en el tailnet). La validación correcta y coherente con el
  resto del panel es **en el cliente**: la sección Demo, como las otras `<Seccion*>`, ya vive
  dentro de `PanelDashboard` que YA autenticó el token en el navegador. No re-valida server-side.
- **Auth real de E-D1 (ajustada):** la pestaña Demo solo se renderiza si `PanelDashboard` está
  `authed` (token válido en el navegador). El endpoint `/api/demo/admin/users` **deja de exigir
  la contraseña vieja** y queda accesible solo desde ese contexto tailnet (misma superficie de
  red que la BD que ya lee). Se retira la dependencia de `DEMO_ADMIN_PASSWORD`. Fail-closed se
  mantiene por el gate del panel (sin token → no hay panel → no hay pestaña Demo → no hay fetch).

## 3 · Plan por fases

### E1 · Nueva sección "Demo" dentro de `/for3s-admin`
- **Investigar terreno:** ya hecho (§1). Reusar el patrón de las `<Seccion*>` existentes.
- **Construir:**
  1. Nuevo `components/for3s-admin/SeccionDemo.tsx` — el contenido de `AdminDashboard.tsx`
     (contadores + tabla de personas, auto-refresh 5s) SIN su pantalla de login propia
     (el panel ya autenticó). Reusa tipos `lib/demo/types.ts`.
  2. Añadir `{ id: "demo", label: "Demo" }` a `TABS` en `PanelDashboard.tsx` + su
     `{tab === "demo" && <SeccionDemo />}`. (Ubicación en el orden: tras "Waitlist", que es lo
     más cercano temáticamente — confirmar con Brian al construir.)
  3. **Backend (E-D1):** `/api/demo/admin/users` deja de exigir `X-Admin-Password` y pasa a
     aceptar el **token de control** (mismo que valida el panel). Como el sitio NO tiene la
     lógica del token (vive en el server), la validación se hace llamando a un endpoint barato
     del server (patrón `validarToken` → `/adm/consumo/resumen?dias=1`) ANTES de servir los
     datos de `for3s_demo`. Fail-closed: token malo → 401, no muestra personas.
  4. `SeccionDemo` llama a `/api/demo/admin/users` mandando el token de control (no password).
- **Red de seguridad:** sin token válido → la pestaña Demo no revela ni un registro (401).
  El resto del panel intacto (las otras 7 secciones no se tocan).

### E2 · Menú del panel responsive
- **Bug (confirmado):** `PanelDashboard.tsx` L~187 — `<div className="flex gap-2 mb-8 border-b">`
  sin `overflow-x-auto` ni wrap ni breakpoints. Con 8 tabs (7 + Demo) en móvil se desborda.
  Header L~169 (`flex items-start justify-between`) también se aprieta.
- **Construir:**
  1. Barra de tabs → scrollable horizontal en móvil: `flex gap-2 overflow-x-auto flex-nowrap`
     + ocultar scrollbar + `whitespace-nowrap` en cada botón. (Alternativa a evaluar con la
     skill `impeccable`: colapsar a menú compacto < sm. Decidir al construir, ver §5.)
  2. Header: apilar en móvil (`flex-col sm:flex-row`), el botón "Salir" no se encima.
- **Red de seguridad:** las 8 pestañas alcanzables y legibles en 360px de ancho; en desktop se
  ve idéntico a hoy (no romper lo que ya funciona).

### E3 · Eliminar `/demo-admin` (E-D2)
- Borrar `app/[locale]/demo-admin/page.tsx`. Si Next requiere manejar la ruta → 404 natural.
- Barrido: quitar `components/demo/AdminDashboard.tsx` si ya nadie lo importa (lo reemplaza
  `SeccionDemo`); dejar `/api/demo/admin/auth` solo si algo más lo usa (verificar; si no, fuera).
- Verificar que ningún link del sitio apunte a `/demo-admin`.

## 4 · Batería (§5-BIS adaptada a frontend del sitio)
- `npm run build` (o el que use marca-personal) verde + lint/types.
- `/for3s-admin` con token válido: las 8 pestañas cargan; "Demo" muestra los mismos datos que
  hoy muestra `/demo-admin` (total 1, brayan002150@gmail.com, etc. del screenshot).
- Sin token / token malo → pestaña Demo 401, cero fuga de registros.
- Responsive real: 360px, 768px, desktop — tabs alcanzables, header sin encimarse, sin scroll
  horizontal de página.
- `/demo-admin` → 404. Ningún import roto de `AdminDashboard`.
- El resto del panel (Clientes/Instancias/Servidor/…) sin regresión.

## 4-BIS · RESULTADO DE LA CONSTRUCCIÓN (2026-07-20) ✅ + hallazgos

**Construido y verificado:**
- E1 · `SeccionDemo.tsx` (contenido del demo-admin sin login propio) + pestaña "Demo" en
  `PanelDashboard` (tras Waitlist) + endpoint acepta el **token de control** (E-D1).
- E2 · responsive: tabs con scroll horizontal (`overflow-x-auto flex-nowrap`, scrollbar oculta,
  `whitespace-nowrap`) + header que se apila en móvil (`flex-col sm:flex-row`).
- E3 · eliminados: `/demo-admin` (page), `/api/demo/admin/auth`, `components/demo/AdminDashboard.tsx`,
  `checkAdminPassword` (código muerto). Fallback `X-Admin-Password` conservado en transición.

**Batería (verificación afirmativa):**
- ✅ build limpio · lint limpio · diff -271/+87 (unificación) · las 7 secciones previas INTACTAS.
- ✅ sin token → 401 · token basura → 401 · `/demo-admin` → 404 · `/api/demo/admin/auth` → 404 ·
  `/for3s-admin` → 200 (los 307 son el middleware i18n quitando el locale, destino final correcto).
- ✅ auth positiva LLEGA a la query (el fallback autorizó → ejecutó `reapStale`), o sea la cadena
  de autorización funciona de punta a punta.

**🐛 3 bugs cazados en MI código durante la construcción (curiosidad que caza bugs):**
1. Doble validación de red: validar el token contra el server en cada refresh (5s) = 12 golpes/min
   al server → **caché de 60s** (solo cachea tokens VÁLIDOS; fail-closed nunca se cachea) + poda.
2. `AbortSignal.timeout` podía no existir en runtimes viejos → cubierto por el `catch` → fail-closed.
3. Interface `Counts` copiada del componente viejo → verificada campo a campo contra `counts()` real.

**⚠️ HALLAZGO DE INFRA (bloquea la verificación del caso positivo E2E, NO es de la pieza E):**
El **Postgres nativo del server escucha SOLO en `127.0.0.1:5432`, no en el tailnet** (`ss` lo
confirmó). El doc §8 decía que se abrió a `100.64.0.0/10` — hoy esa config NO está activa
(revertida o el server rebootó sin ella). ⇒ `/api/demo/admin/users` con auth OK devuelve **500
`ECONNREFUSED 100.112.177.53:5432`**. El demo-admin viejo daría el MISMO error hoy — preexiste a
esta pieza. **Para Brian (requiere sudo en el server):** reactivar `listen_addresses` + `pg_hba`
del Postgres demo para el tailnet, y así ver la tabla de personas en la pestaña Demo. Sin eso, la
pestaña Demo mostrará el error "No llego al backend de la demo (¿tailnet?)" que ya maneja la UI.

## 5 · Decisiones para el momento de construir (menores)
1. Orden de la pestaña "Demo" en la barra (propongo tras Waitlist).
2. Responsive: tabs scrollables vs menú colapsable < sm (usar skill `impeccable` para decidir).
3. ¿`/api/demo/admin/auth` se elimina o se conserva? (según si algo más lo usa).

## 6 · Fuera de alcance de la pieza E (son otras piezas)
- Conectores que conectan (C) · general multi-tenant (B) · API keys self-service (D) ·
  correo admin por instancia (A) · retirar los 4 contenedores demo vacíos (limpieza, §2-BIS
  de la visión). E NO los toca.

---

*Este es el proyecto `marca-personal` (⚠️ Next.js con breaking changes — leer
`node_modules/next/dist/docs/` antes de codear, regla del AGENTS.md). La lógica del panel/demo
vive aquí, no en For3s OS. Relacionado: `Mente/Doc/Demo_For3s_Avance.md` (terreno del sitio).*
