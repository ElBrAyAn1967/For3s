# Demo For3s QA — Avance de construcción

> **Ubicación del proyecto:** `marca-personal` (sitio web público de For3s QA).
> **Página:** `/demo` (y `/demo/[token]` para las 1:1).
> **Última actualización:** 2026-06-17.
> **Stack:** Next.js 16 · React 19 · Tailwind 4 · next-intl (es/en) · framer-motion · postgres.js.

---

## 0. Qué es esto

La página `/demo` del sitio dejó de ser un placeholder "Coming Soon" y ahora es una
**demo interactiva con control de acceso, capacidad y sesiones persistentes**, conectada
a una base de datos real en el servidor for3s. Tres tipos de demo, cada una aislada.

---

## 1. Los 3 tipos de demo (3 URLs)

| Demo | URL | Modelo | Capacidad | Acceso |
|---|---|---|---|---|
| **General** | `/demo` | abierta N:N | **10 concurrentes** + lista de espera | cualquier correo válido |
| **Jazz** | `/demo/<token-secreto>` | 1:1 | 1 | **solo el correo autorizado** de Jazz |
| **Mashe** | `/demo/<token-secreto>` | 1:1 | 1 | **solo el correo autorizado** de Mashe |
| **Brian** | `/demo/<token-secreto>` | 1:1 | 1 | **solo el correo autorizado** de Brian |

- Los **tokens** de las 1:1 son secretos impredecibles (actúan como contraseña en la URL). Token inválido → 404.
- Token de Brian (dev/actual): `b-pwQH4B_l0caRY16Uk1SEOU2P`. Jazz/Mashe tienen los suyos (en env).
- Cada demo corre (o correrá) en **su propio contenedor Docker** en el server → aislamiento total.

---

## 2. El flujo del usuario (orden definitivo)

1. **Menú "Demo"** del navbar → lleva a `/demo` (antes iba mal a `#contact`).
2. **`/demo` = la ENTRADA:** una sola tarjeta con **nombre + correo + botón "Conectar con For3s"**.
   Aquí se ve el navbar/encabezado/footer del sitio.
3. Al conectar → **se oculta todo lo del sitio** y entra al **shell de la app** (sidebar + topbar propios).
4. **Primera petición dentro del shell:** pegar la **API key de Claude** (`sk-ant-…`).
   La navegación Perfil/Conectores queda bloqueada hasta conectarla.
5. Con la key → aparecen **Perfil** y **Conectores**.

**Detalle técnico clave:** hay UN SOLO `<GeneralExperience>` en posición fija del árbol
(con `key` estable) para que React no lo remonte al alternar entre "modo sitio" y "modo app".
Si se remonta, se pierde el estado y reaparece el form (bug que ya estaba y se corrigió).

---

## 3. Reglas de identidad y acceso

### General
- **Acceso = nombre + correo.** Si el correo no existe → registro nuevo (vincula nombre↔correo).
- Volver con **mismo nombre + mismo correo** → continúa donde se quedó (sesión persistente).
- Correo existe + **nombre distinto** → **acceso denegado** (HTTP 409 `name_mismatch`).
- **Validación de formato de email** (correo real). Inválido → HTTP 400.
- **Todo se normaliza a minúsculas** (regla de Brian): `Brian@Gmail.COM` → `brian@gmail.com`.
  Así no hay duplicados por mayúsculas/minúsculas.
- **Cada correo = un SK (API key).** Correos únicos por demo.

### Jazz / Mashe / Brian (1:1) — mismo formato que General, MÁS:
- **Solo el correo autorizado** de esa demo puede entrar. Correo no autorizado → **404 hermético**
  (no revela nada, como si la demo no existiera para ese correo).
- 1ª vez (correo autorizado + nombre) → **vincula** ese nombre a ese correo.
- Volver = mismo nombre + mismo correo (igual que General; nombre distinto → denegado).

---

## 4. Capacidad y lista de espera (General)

- Tope **10 sesiones activas** simultáneas.
- Usuario **#11+** → pantalla especial: *"Te enviaremos una notificación a tu correo cuando
  haya cupos disponibles."* (no posición en vivo; es waitlist por email).
- Cuando alguien **cierra sesión** (botón) o **cierra la pestaña** (`sendBeacon` en `pagehide`)
  → libera su cupo → se **promueve** al primero de la cola → se le **notifica** (stub email).
- Sesión inactiva > 60s sin heartbeat → se libera su cupo (pero su registro persiste).
- Las 1:1 también tienen cola conceptual (tope 1), aisladas de General.

---

## 5. API key del usuario (cifrada)

- El usuario pega su **propia** API key de Anthropic (vía legal — NO OAuth de suscripción).
- La key viaja al server **una sola vez** (`POST /api/demo/general/apikey`), se **cifra ahí**
  (**AES-256-GCM**, clave maestra `DEMO_ENC_KEY` solo en el server) y se guarda en
  `demo_users.api_key_enc`. **Nunca** vuelve al navegador, **nunca** se guarda en claro.
- Se guarda `api_key_hint` (últimos 4, ej. `…x9f2`) para mostrar en UI sin descifrar.
- **Ligada a (kind, correo)** → al volver con su nombre+correo, si **ya tiene key guardada →
  entra directo** (sin pedirla otra vez).
- Verificado: en BD se ve cifrada (blob base64, no el plaintext); descifrado round-trip correcto.

---

## 6. El shell de la app (dentro de la demo)

Layout tipo app, **oculta el menú del sitio**:
- **Sidebar izquierdo** + **topbar**: navegación Perfil / Conectores + Cerrar sesión.
- **Perfil**: datos tipo Claude/ChatGPT — avatar (inicial), nombre, correo, API key conectada
  (`Claude · …x9f2`), badge "Conectado".
- **Conectores** (solo UI/placeholder por ahora): GitHub, Vercel, Adobe Premiere,
  Adobe Illustrator, Google Drive, PC, Telegram. Botón "Conectar" en cada uno (aún no conectan).

---

## 7. Dashboard admin

- Ruta: **`/demo-admin`** (login por contraseña `DEMO_ADMIN_PASSWORD`, header `X-Admin-Password`).
- Muestra: conteos (total / activos N/10 / en espera) + tabla de personas
  (**Demo** [kind], Nombre, Correo, Estado, Cola, Notificado, Registrado). Auto-refresca cada 5s.
- Patrón inspirado en el waitlist+dashboard de **godinez-ai** (que usa Convex+Resend),
  adaptado a Next + Postgres.

---

## 8. Infraestructura (server for3s)

- **La BD de la demo NO está en Docker** — Postgres 16 **nativo** en el server for3s.
- BD dedicada **`for3s_demo`** + rol `for3s_demo`, **separada** de la BD `for3s` de For3s OS.
- Conexión desde el sitio (equipo local) → server vía **Tailscale** (`100.112.177.53:5432`).
  Se abrió Postgres a la red Tailscale (`listen_addresses` + regla `pg_hba` solo para
  `for3s_demo` desde subred `100.64.0.0/10`). For3s OS sigue en `127.0.0.1`, intacto.
- **4 contenedores Docker vacíos** corriendo (alpine, `--restart unless-stopped`, label
  `for3s.demo=true`): `for3s-demo-{jazz,mashe,brian,general}` — listos para meterles For3s.
- **Tablas:** `demo_accounts` (las 4 cuentas + tokens), `demo_users` (personas, con `kind`,
  `api_key_enc`, `api_key_hint`), `demo_sessions`, `demo_events`.
- Índice único: `(kind, lower(email))` → un correo puede estar en General Y en su 1:1.

---

## 9. Archivos clave (en el repo del sitio)

**Lógica / datos:**
- `lib/demo/types.ts` — tipos (DemoKind, SessionStatus, RegisterResult, DemoUser…).
- `lib/demo/db.ts` — cliente postgres.js (DEMO_DATABASE_URL).
- `lib/demo/userStore.ts` — registro/cola/capacidad por `kind` (SQL + transacciones).
- `lib/demo/normalize.ts` — normalización a minúsculas + validación de email.
- `lib/demo/crypto.ts` — cifrado AES-256-GCM de la API key.
- `lib/demo/allowedEmails.ts` — correos autorizados de las 1:1.
- `lib/demo/accounts.ts` — resolución de token → demo.
- `lib/demo/session.ts` — cookie de sesión (`kind:email`, httpOnly).
- `lib/demo/email.ts` — notificación de cupo (STUB, listo para Resend).
- `lib/demo/admin.ts` — auth del dashboard.

**API routes (`app/api/demo/`):**
- `general/register` — registra/continúa por nombre+correo (valida email + correo autorizado).
- `general/heartbeat` — mantiene viva la sesión + reevalúa cola.
- `general/logout` — libera cupo + promueve + notifica.
- `general/apikey` — recibe la key, cifra y guarda.
- `admin/auth`, `admin/users` — dashboard.

**UI (`components/demo/`):**
- `GeneralPageShell.tsx` — wrapper que oculta navbar/footer al entrar al shell.
- `GeneralExperience.tsx` — máquina de estados (register → active/waitlist).
- `GeneralRegister.tsx` — form entrada (nombre+correo+"Conectar con For3s").
- `GeneralWaitlist.tsx` — pantalla #11 "te avisaremos por correo".
- `DemoShell.tsx` — shell (sidebar+topbar), gate de API key como 1ª petición.
- `ConnectApiKey.tsx` — pegar API key (cifra server-side con `persist`).
- `ProfilePanel.tsx` / `ConnectorsPanel.tsx` — Perfil / Conectores.
- `AdminDashboard.tsx` — dashboard admin.

**Páginas:**
- `app/[locale]/demo/page.tsx` — General.
- `app/[locale]/demo/[token]/page.tsx` — Jazz/Mashe/Brian (resuelve por token).
- `app/[locale]/demo-admin/page.tsx` — dashboard.

**Migración:** `db/demo/0001_init.sql` (contrato de las tablas).

**i18n:** namespace `Demo` en `messages/{es,en}.json`.

---

## 10. Variables de entorno (en `.env.local`, NO se commitea)

```
DEMO_DATABASE_URL=postgres://for3s_demo:****@100.112.177.53:5432/for3s_demo
DEMO_ENC_KEY=****                 # 32 bytes base64, cifra las API keys
DEMO_ADMIN_PASSWORD=****          # acceso al dashboard
DEMO_JAZZ_TOKEN / DEMO_MASHE_TOKEN / DEMO_BRIAN_TOKEN   # tokens secretos de URL
DEMO_JAZZ_EMAIL / DEMO_MASHE_EMAIL / DEMO_BRIAN_EMAIL   # correos autorizados 1:1
DEMO_OAUTH_INTERNAL=1             # ⚠️ flag del OAuth Claude (solo pruebas internas)
```

---

## 11. PENDIENTES / próximos pasos

- 🔴 **Correos reales de Jazz/Mashe/Brian** — hoy son placeholders (`*@example.com`).
  Brian los pasará → reemplazar en `.env.local`.
- 🟡 **Email real (Resend)** — hoy es STUB (registra el evento, no manda correo).
  Enchufar Resend con API key cuando esté.
- 🟡 **Conectores** — hoy solo UI. Cablear conector por conector (GitHub primero, ya hay MCP en For3s OS).
- 🟡 **La experiencia real "pegar contexto → QA Pack"** — el shell está listo; falta el contenido
  que genera el QA Pack (conectar al For3s real del server).
- 🟢 **Meter For3s a los 4 contenedores Docker** (hoy vacíos).
- 🟢 **OAuth de suscripción Claude** (solo Jazz/Mashe/Brian, flag `DEMO_OAUTH_INTERNAL`): existe
  el flujo "pegar código" pero es zona prohibida por términos de Anthropic → solo pruebas internas,
  apagado por defecto en producción. No promover a usuarios reales.

---

## 12. Nota de cumplimiento (importante)

El **OAuth de suscripción de Claude** (botón tipo Claude Code) está **prohibido por Anthropic**
para apps de terceros (vigente desde abril 2026, caso OpenClaw/OpenCode → baneos). Por eso la
vía oficial de la demo es **el usuario pega su propia API key** (legal, su billing paga).
El OAuth quedó implementado SOLO para pruebas internas, tras un guard (`DEMO_OAUTH_INTERNAL=1`)
que lo mantiene **muerto por defecto** en cualquier deploy.
