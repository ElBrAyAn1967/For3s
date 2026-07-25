# 🗺️ DEMO — Mapa Maestro por Bloques (trabajo atómico)

> **Regla de trabajo (Brian 2026-07-24):** trabajamos ATÓMICO. Un bloque grande = **DEMO**.
> Dentro viven SISTEMAS. NO avanzamos al siguiente sistema hasta cerrar el actual con evidencia.
> Identificamos CADA proceso sin omitir nada. Este archivo es el tablero: se actualiza por bloque.
>
> **Alcance:** SOLO la demo web (`for3s.vercel.app/demo`, repo `ElBrAyAn1967/For3s` = `marca-personal/`).
> Estado de datos: Neon (`DEMO_DATABASE_URL`). El chat del dueño enruta al servidor `for3s`.
>
> **Leyenda estado:** ✅ funciona y verificado · 🔧 tiene bug/pendiente conocido · ❓ sin verificar aún · ⚪ existe, no revisado en esta ronda.

---

## 🏛️ BLOQUE GRANDE: DEMO

Objetivo del bloque: que un usuario pueda **entrar, ser catalogado correctamente, y usar For3s**
(general, dueño-enrutado, o 1:1), de forma limpia y sin fricción, con estado fiel en Neon.

Se compone de estos SISTEMAS (cada uno se cierra por separado):

| # | Sistema | Qué hace | Estado global |
|---|---|---|---|
| S1 | **Entrada / Registro** | nombre+correo → crea/continúa persona en Neon | 🔧 |
| S2 | **Reconocimiento de dueño** | ¿el correo es dueño de una instancia? (check-dueno) | ✅ |
| S3 | **Verificación por código** | código a correo (Resend) → valida → cookie dueño | ✅ |
| S4 | **Enrutamiento del chat** | general vs dueño→instancia del servidor | ✅ |
| S5 | **Sesión / persistencia** | cookies, rehidratar, heartbeat, logout, cupo | 🔧 |
| S6 | **API key (BYOK)** | conectar/guardar/usar sk-ant del usuario | 🔧 |
| S7 | **Shell de la app** | chat, perfil, conectores, keys, cerebro | ⚪ |
| S8 | **Cola / capacidad** | waitlist cuando se llena el cupo | ❓ |
| S9 | **1:1 privadas** | puertas con token/link + correo autorizado | ⚪ |
| S10 | **Panel admin** | crear/editar/borrar personas y demos | ⚪ |
| S11 | **Conectores** | GitHub OAuth, n8n, etc. | ⚪ |

---

## 🧩 DETALLE POR SISTEMA (procesos, archivos, tablas, estado)

### S1 · ENTRADA / REGISTRO  🔧
- **Qué pasa:** el usuario mete nombre+correo en `/demo` → `POST /api/demo/general/register`.
- **Archivos:** `components/demo/GeneralRegister.tsx` (UI) · `app/api/demo/general/register/route.ts` ·
  `lib/demo/userStore.ts` (`registerOrResume`) · `lib/demo/allowedEmails.ts` · `lib/demo/accountStore.ts` (`esCorreoDePrivada`).
- **Tabla:** `demo_users` (kind, name, email, status, position, api_key_enc, api_key_hint, agent_on, kind_ui).
- **Reglas:** general no restringe correos; 1:1 solo el correo autorizado (404 hermético si no).
  Continuar = nombre+correo deben coincidir (si correo existe con otro nombre → `name_mismatch`).
- **Procesos internos:** reapStale (limpia sesiones muertas) · activeCount (cupo) · promote (cola).
- **Estado 🔧:** funciona, pero acoplado a S5/S6 (al registrar dueño se separó "registrar" de "entrar",
  y la key se resuelve por heartbeat). Verificar de nuevo tras cerrar S5/S6.

### S2 · RECONOCIMIENTO DE DUEÑO  ✅
- **Qué pasa:** al meter el correo, la UI llama `POST /api/demo/check-dueno` ANTES de registrar.
- **Archivos:** `app/api/demo/check-dueno/route.ts` · `lib/demo/duenos.ts`.
- **Tabla:** `demo_duenos` (email→instancia, nombre). Config sembrada a mano (brayan002150→brian).
- **Estado ✅:** verificado en vivo — devuelve `{dueno:true, instancia:"brian"}`.

### S3 · VERIFICACIÓN POR CÓDIGO  ✅
- **Qué pasa:** si es dueño → `verify/send` (código 6 díg a correo por Resend) → usuario lo mete →
  `verify/check` valida → deja cookie httpOnly `for3s_demo_dueno`.
- **Archivos:** `app/api/demo/verify/send/route.ts` · `verify/check/route.ts` · `lib/demo/verificacion.ts` ·
  `lib/demo/email.ts` (Resend) · `lib/demo/session.ts` (setDuenoVerificado).
- **Tabla:** `demo_verificaciones` (email, codigo_hash sha256, instancia, expira_at, intentos, usado).
- **Seguridad:** hash (nunca claro) · expira 10min · máx 5 intentos · un solo uso.
- **Estado ✅:** verificado en vivo (código llegó, validó, usado=t). ⚠️ Nota externa (NO de este bloque):
  Resend con `onboarding@resend.dev` solo entrega al correo dueño de la cuenta Resend.

### S4 · ENRUTAMIENTO DEL CHAT  ✅
- **Qué pasa:** `POST /api/demo/general/chat` lee cookie dueño → si dueño verificado, `chatDueno()`
  a SU instancia del servidor; si no, `chatGeneral()`.
- **Archivos:** `app/api/demo/general/chat/route.ts` · `lib/demo/for3sChat.ts`.
- **Config:** `FOR3S_INST_<INSTANCIA>_KEY` (ej. FOR3S_INST_BRIAN_KEY) + canal público del servidor.
- **Estado ✅:** verificado — el chat del dueño llega a la instancia brian del servidor.

### S5 · SESIÓN / PERSISTENCIA  🔧
- **Qué pasa:** cookies de sesión (sid 24h, email 30d, dueño 12h) · heartbeat cada 5s · rehidratar
  al montar · logout · liberar cupo.
- **Archivos:** `components/demo/GeneralExperience.tsx` · `lib/demo/session.ts` · `app/api/demo/general/heartbeat|logout/route.ts`.
- **Tabla:** `demo_users.status` + `last_seen_at` · `demo_sessions`.
- **Arreglado (2026-07-24, e61fd5b):** rehidratar de cookie al montar (back/refresh ya no sacan) +
  quitado logout en pagehide (se disparaba con navegación normal). Cupo se libera por reapStale.
- **Estado 🔧:** arreglado, FALTA re-verificar en vivo (back/refresh mantienen sesión + key).

### S6 · API KEY (BYOK)  🔧
- **Qué pasa:** usuario pega su `sk-ant` → se cifra y guarda → el chat general la usa como su cupo.
- **Archivos:** `components/demo/ConnectClaude.tsx` · `ConnectApiKey.tsx` · `ApiKeysPanel.tsx` ·
  `app/api/demo/general/apikey|keys/route.ts` · `lib/demo/apiKey.ts` · `lib/demo/crypto.ts`.
- **Tabla:** `demo_users.api_key_enc` (cifrada) + `api_key_hint`.
- **Arreglado (2026-07-24, 7bc07c3):** al verificar código, el dueño ya no recibe hasApiKey:false
  hardcodeado; se pide el estado real a heartbeat → si ya conectó key, no la re-pide.
- **🔧 DECISIÓN ABIERTA (pausada por Brian):** ¿el DUEÑO enrutado a instancia del servidor debe pedir
  su sk-ant? Su chat usa FOR3S_INST_BRIAN_KEY (cerebro del servidor), no su key personal. Caso A
  (general/BYOK) sí necesita key; Caso B (dueño→instancia) la ignora. Decidir después.
- **Estado 🔧:** arreglado el reconocimiento; falta decidir el caso dueño + re-verificar en vivo.

### S7 · SHELL DE LA APP  ⚪
- **Qué:** `DemoShell.tsx` (sidebar: Chat/Perfil/Conectores/API keys/Cerebro). Gate: sin key, nav bloqueada.
- **Estado ⚪:** no revisado a fondo esta ronda.

### S8 · COLA / CAPACIDAD  ❓
- **Qué:** si el cupo (max_concurrent, general=10) está lleno → waitlist. `GeneralWaitlist.tsx` · `WaitingRoom.tsx`.
- **Estado ❓:** no probado con cupo lleno esta ronda.

### S9 · 1:1 PRIVADAS  ⚪
- **Qué:** puertas con token/link secreto + correo autorizado + instancia. `app/[locale]/demo/[token]/page.tsx`.
- **Tabla:** `demo_accounts` (token, email_autorizado, instancia, container_name, max_concurrent).
- **Estado ⚪:** 6 filas config vivas; no probado E2E esta ronda.

### S10 · PANEL ADMIN  ⚪
- **Qué:** `for3s-admin` — crear/editar/borrar personas y demos. `app/api/demo/admin/*`.
- **Estado ⚪:** no revisado esta ronda.

### S11 · CONECTORES  ⚪
- **Qué:** GitHub OAuth (`connectors/github/*`), n8n/NotebookLM (UI). `ConnectorsPanel.tsx`.
- **Estado ⚪:** no revisado esta ronda.

---

## 🗄️ SISTEMA TRANSVERSAL: BASE DE DATOS (Neon) — su propio bloque

> La BD es tan grande que es un sistema en sí. TODO el estado de la demo vive aquí. Un solo cliente
> Postgres (`lib/demo/db.ts`, pool de 10, SSL auto). Conexión: `DEMO_DATABASE_URL` (Neon, us-east-1).

### Tablas y su rol (el "estado" de cada sistema)
| Tabla | Rol | Escrita por | Leída por | ¿Config o volátil? |
|---|---|---|---|---|
| `demo_users` | PERSONAS/sesiones (kind, status, api_key_enc, agent_on) | userStore, accountStore | register, heartbeat, chat, apikey, admin | 🔄 volátil (se limpia) |
| `demo_duenos` | MAPA correo→instancia (quién es dueño) | duenos (semilla manual) | check-dueno | 🔒 config |
| `demo_verificaciones` | CÓDIGOS de verificación (hash, expira, intentos, usado) | verificacion | verify/check | 🔄 volátil |
| `demo_accounts` | PUERTAS 1:1 (token/link, correo autorizado, instancia) | accountStore, admin | register, [token], admin | 🔒 config |
| `demo_sessions` | sesiones por cookie_id | store, session | heartbeat | 🔄 volátil |
| `demo_events` | telemetría/eventos | (poco usada) | admin | 🔄 volátil |
| `*_bak_*` | respaldos de migraciones pasadas | (manual) | — | 🗄️ backup |

### Estructura clave (columnas)
- **demo_users:** `id, kind, name, email, status, position, notified, api_key_enc, api_key_hint,
  created_at, last_seen_at, agent_on, kind_ui`. PK lógica = (kind, lower(email)).
- **demo_duenos:** `email(PK), instancia, nombre, creado_at`.
- **demo_verificaciones:** `email(PK), codigo_hash, instancia, expira_at, intentos, usado, creado_at`.
- **demo_accounts:** `id, kind, token, max_concurrent, container_name, created_at, nombre_persona,
  email_autorizado, instancia`.

---

## 🌐 RADIOGRAFÍA HTTP → BD (cada endpoint: método, qué recibe, qué toca en Neon, qué devuelve)

> Esta es la tabla para "ver qué está pasando" a nivel BD por cada llamada del navegador.

| Endpoint | HTTP | Recibe (body) | Operación en Neon | Devuelve |
|---|---|---|---|---|
| `/demo/check-dueno` | POST | `{email}` | SELECT `demo_duenos` | `{dueno, instancia, nombre}` |
| `/demo/verify/send` | POST | `{email}` | INSERT/UPSERT `demo_verificaciones` (código nuevo) | `{ok}` + correo Resend |
| `/demo/verify/check` | POST | `{email, codigo}` | SELECT + UPDATE `demo_verificaciones` (usado=t) | `{ok, instancia}` + cookie dueño |
| `/demo/general/register` | POST | `{kind, name, email}` | SELECT + INSERT/UPDATE `demo_users` (reapStale, promote) | `RegisterResult` + cookie email |
| `/demo/general/heartbeat` | POST | — (cookie) | SELECT `demo_users` (touch: UPDATE last_seen) | `RegisterResult` (status, hasApiKey…) |
| `/demo/general/chat` | POST | `{message}` (cookie) | (lee cookie; NO BD directa) → servidor for3s | `{reply}` |
| `/demo/general/apikey` | POST | `{apiKey}` | UPDATE `demo_users` SET api_key_enc, api_key_hint | `{ok, hint}` |
| `/demo/general/keys` | GET/POST/DELETE | — / `{apiKey}` | SELECT/UPDATE `demo_users` (key) | estado de la key |
| `/demo/general/profile` | POST | perfil | UPDATE `demo_users` | `{ok}` |
| `/demo/general/agent` | POST | `{on}` | UPDATE `demo_users` SET agent_on | `{ok}` |
| `/demo/general/logout` | POST | — (cookie) | UPDATE `demo_users` (libera cupo) + borra cookies | `{ok}` |
| `/demo/[token]` (1:1) | GET (page) | token en URL | SELECT `demo_accounts` | render de la 1:1 |
| `/demo/admin/users` | GET | — (pass admin) | SELECT `demo_users` | lista de personas |
| `/demo/admin/users/[id]` | PATCH/DELETE | edición | UPDATE/DELETE `demo_users` | `{ok}` |
| `/demo/admin/accounts` | GET/POST | crear 1:1 | SELECT/INSERT `demo_accounts` (+demo_users) | `{token}` / lista |
| `/demo/connectors/github/*` | GET/DELETE | OAuth | (tokens de conector) | flujo GitHub |
| `/demo/status` | GET | — | SELECT (cupo/estado) | estado general |
| `/demo/join` `/leave` `/heartbeat` | POST | — | `demo_sessions` (legado) | estado |

**Notas de lectura:**
- El **chat NO toca la BD directamente** — lee la cookie de dueño y reenvía al servidor `for3s`. El
  estado que importa para el chat es la **cookie**, no una tabla.
- `heartbeat` es el que **rehidrata** la sesión (S5) y el que devuelve `hasApiKey` real (S6).
- Toda escritura de identidad pasa por `userStore` (transaccional con `sql.begin`).

### 🔎 Comandos de inspección en vivo (para ver qué pasa en Neon durante una prueba)
```bash
cd ~/for3s/marca-personal
DBURL=$(grep '^DEMO_DATABASE_URL=' .env.local | cut -d= -f2-)
# tu persona:
psql "$DBURL" -c "SELECT kind,name,status,(api_key_enc IS NOT NULL) key,api_key_hint,agent_on,last_seen_at FROM demo_users WHERE lower(email)='<correo>';"
# tu código de verificación:
psql "$DBURL" -c "SELECT instancia,intentos,usado,expira_at FROM demo_verificaciones WHERE lower(email)='<correo>';"
# eres dueño?:
psql "$DBURL" -c "SELECT * FROM demo_duenos WHERE email='<correo>';"
```

---

## 📌 CÓMO TRABAJAMOS (protocolo del tablero)
1. Brian elige el SISTEMA a cerrar (ej. "cerremos S5").
2. Investigamos TODOS sus procesos (sin omitir), listamos qué debe pasar.
3. Arreglamos/construimos lo que falte.
4. Verificamos EN VIVO con evidencia (Neon + navegador).
5. Marcamos ✅ en este tablero. Solo entonces pasamos al siguiente.

**Próximo:** Brian marca qué sistema cerramos primero.
