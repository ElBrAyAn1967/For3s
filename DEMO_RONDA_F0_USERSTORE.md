# Ronda F0 — `userStore.ts` de MVP a PRODUCTO

> **Método de Fases "F"** (`Mente/Cuerpo/ESTANDAR_Metodo_Fases_F.md`): explicar → aprobar →
> construir. Este documento es el F0: **nada se construye hasta que Brian apruebe.**
>
> Fecha: 2026-07-26 · Autor: auditoría pedida por Brian ("descubre todo de userStore.ts")

---

## 1 · Qué es este archivo hoy

**603 líneas · 22 funciones · 44 sentencias SQL · 11 consumidores.**
Es el archivo más grande de `lib/demo/` (22% del módulo) y el único de los grandes que
**nunca se reestructuró**: creció 485 → 603 por acumulación de fixes (11 commits de cableado
C2/C3/C6p1 + 5 bugs + 2 optimizaciones), mientras `for3sChat.ts` bajaba 362 → 329 al recibir
su refactor.

El plan de optimización lo dijo explícito: *"❌ Reescribir userStore.ts desde cero. Se optimiza
lo medido, se conserva lo que funciona."* Fue correcto entonces (optimizar no es romper).
Deja el trabajo pendiente ahora.

### Por dónde pasa (superficie de riesgo)
Registro · cupo/cola · heartbeat · hilos · API keys · panel admin. **11 consumidores:**

| Consumidor | Usa |
|---|---|
| `general/register` | `registerOrResume` |
| `general/heartbeat` | `touch` |
| `general/logout` | `endSession`, `listUsers` |
| `general/apikey` · `general/profile` | `saveApiKey`, `updateName` |
| `general/agent` | `setAgentState` |
| `verify/check` | `promoverDuenoAsuInstancia`, `nombreDe` |
| `admin/users` · `admin/users/[id]` | `listUsers`, `counts`, `editarUsuario`, `eliminarUsuario`, `cambiarDemoMock` |
| `lib/email.ts` | `markNotified` |
| `lib/for3sChat.ts` | `instanciaRealDe`, `hiloDe` |

---

## 2 · Hallazgos (medidos, no opinión)

### 🔴 H1 · CERO degradación — `0 try/catch` en 44 accesos a BD
Ningún camino amortigua un fallo de Neon. Si la BD parpadea, **lanza** y tumba el registro, el
heartbeat o el panel. Es el MISMO bug que se cerró hoy en `instancias.ts`, donde la red de
seguridad estaba documentada pero no existía.

### 🔴 H2 · No hay capa base — `const sql = db()` ×16
Cada función abre su propio acceso y escribe su propio SQL. No existe un sitio que sepa "cómo se
habla con `demo_users`": lo saben 22 funciones por separado. Contrasta con el estándar del módulo:
`config.ts` (1 función privada → getters) · `instancias.ts` (`leerFila` → getters) ·
`acceso.ts` (1 puerta `resolverAcceso`).

### 🔴 H3 · El parámetro MIENTE — 12 funciones reciben `kind: DemoKind` que **es la instancia**
```ts
async function reapStale(sql, kind: DemoKind, ...)
  WHERE instancia = ${kind}      // recibe "kind", consulta "instancia"
```
No es cosmético: es la confusión que produjo el barrido `b61e3d0` ("cookie kind ≠ instancia
real"), el bug de telemetría cerrado hoy y los de "key en el agente equivocado". **Mientras el
parámetro se llame `kind`, el patrón reaparece.**

### 🟠 H4 · Doble escritura `kind`+`instancia` (deuda C6p2) y el candado que la bloquea
```ts
INSERT INTO demo_users (kind, instancia, ...) VALUES (${kind}, ${kind}, ...)  // mismo valor ×2
ON CONFLICT (kind, lower(email))                                             // ← el candado
```
El índice único `idx_demo_users_kind_email_lower` es **sobre `kind`**. Por eso C6p2 ("borrar la
columna `kind`") lleva bloqueado: nadie había localizado que el `ON CONFLICT` depende de él.
**Verificado en Neon: `kind` e `instancia` NUNCA divergieron** (0 filas distintas) → migrar el
índice a `instancia` es seguro.

### 🟡 H5 · `demo_accounts` sigue viva y referenciada
`eliminarUsuario` hace `DELETE FROM demo_accounts WHERE kind='privado'`. C6p2 quiere borrar esa
tabla, pero **tiene 6 filas** → NO es código muerto todavía. Hay que investigar quién más la usa
antes de tocarla (fuera del alcance de esta ronda; se documenta).

### 🟡 H6 · Redundancia: `kind` ×67 · normalización de correo ×20
`WHERE instancia = ${kind} AND status = ...` se repite 13 veces casi idéntico.

### ✅ Lo que está BIEN (no tocar)
- **6 transacciones** `sql.begin` bien usadas (registro, promoción, heartbeat).
- **Optimizaciones O-F1..O-F5 reales**: memoización por operación (`OpCtx`), N+1 eliminado,
  freno de mantenimiento. Cualquier refactor debe **conservarlas** y demostrarlo.
- Lecturas ya migradas a `WHERE instancia` (C6p1 hecho).

---

## 3 · Las piezas (orden propuesto)

Cada pieza es atómica, verificable y commiteable por separado. **Regla: comportamiento idéntico
salvo donde se diga explícitamente.**

### U1 · Red de seguridad (cierra H1) — *primero porque es el riesgo vivo*
Envolver los caminos de lectura en degradación, siguiendo el patrón de `instancias.ts`:
lectura que falla → valor seguro + `console.warn`; escritura que falla → sigue lanzando (una
escritura perdida SÍ debe avisar; no se puede fingir que se guardó).
**Verificar:** con Neon caído, el panel y el heartbeat degradan en vez de reventar.

### U2 · Capa base (cierra H2) — el corazón de la ronda
Una función privada que sepa hablar con `demo_users` (`buscarPersona(correo)` / helpers de
acceso), y que las 22 funciones se apoyen en ella en vez de abrir `db()` por su cuenta.
Es exactamente el movimiento de `llamarAgente()` en `for3sChat.ts` (−79% de plomería).
**Verificar:** mismo número de viajes a Neon o menos (no romper O-F1..O-F5).

### U3 · Renombrar `kind` → `instancia` (cierra H3)
12 firmas + usos internos. **Cambio de nombres, cero cambio de lógica.** Los 11 consumidores
pasan el valor posicionalmente, así que la superficie externa no se mueve.
**Verificar:** build + typecheck + comportamiento idéntico.

### U4 · Matar la doble escritura (cierra H4, desbloquea C6p2)
1. Crear índice único sobre `(instancia, lower(email))`.
2. Mover el `ON CONFLICT` a ese índice.
3. Dejar de escribir `kind` en los 2 INSERT.
4. (Fuera de esta ronda) borrar la columna cuando lleve tiempo sin escribirse.
**Verificar:** el registro repetido sigue "continuando sesión", no duplicando.
⚠️ **Toca el esquema de producción** → migración con respaldo y reversa demostrada.

### U5 · Documentar `demo_accounts` (H5)
No borrar nada: investigar consumidores y dejar registrado qué falta para retirarla.

---

## 4 · Lo que esta ronda NO hace
- ❌ **No reescribe el archivo desde cero.** Se conserva lo que funciona (transacciones,
  optimizaciones); se cambia la forma, no el comportamiento.
- ❌ No borra la columna `kind` (solo deja de escribirla).
- ❌ No borra `demo_accounts`.
- ❌ No toca las 3 listas fijas que son candados de seguridad (oauthGuard, accountStore, accounts).

## 5 · Riesgo y orden
`userStore` está en el camino crítico de **todo** el flujo. Por eso: U1 (red) antes que nada,
U3 (renombrar, riesgo cero) antes que U2 (mover lógica), y U4 al final porque es el único que
toca el esquema.

**Batería §5-BIS por pieza:** build + typecheck + comportamiento contra Neon + E2E del flujo
completo (registro → verificación → chat → key → logout), con verificación AFIRMATIVA.

## 6 · Lección aplicada de hoy
Dos incidentes del 2026-07-26 (clave de cifrado divergente, Funnel apagado) salieron de
**verificar desde local y asumir que probaba producción**. En esta ronda, cada pieza que toque
algo compartido se verifica **desde el entorno del consumidor real**, no solo desde el mío.
