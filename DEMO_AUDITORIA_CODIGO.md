# 🔬 AUDITORÍA DEL CÓDIGO DE LA DEMO — plan de pulido (aprobar antes de tocar)

> Mismo método que funcionó con la BD: **radiografía → entender → decidir → limpiar por fases**.
> Estado previo: BD reestructurada y VERIFICADA (integridad 7/7, candados 8/8, E2E 6/6, endpoints
> 8/8 vivos). Ahora toca el código. **⛔ CERO cambios hasta aprobar este plan.**

---

## 0 · TAMAÑO DEL TERRENO
| Capa | Archivos | Líneas |
|---|---|---|
| `lib/demo/` (lógica) | 24 | 2,368 |
| `app/api/demo/` (endpoints) | 23 rutas | ~119 (+ lógica en lib) |
| `components/demo/` (UI) | 14 | 2,457 |
| **Total** | **61** | **~4,944** |

Los 3 más grandes: `userStore.ts` (485) · `for3sChat.ts` (362) · `accountStore.ts` (211).

---

## 1 · HALLAZGOS (evidencia real)

### 🔴 H-C1 · `DemoKind` hardcodeado — el mismo bug que tenía la BD, ahora en TypeScript
`types.ts:10` → `export type DemoKind = "jazz" | "mashe" | "brian" | "general"`.
**Usado en 27 archivos.** Si agregas la instancia `acme` en `demo_instancias` (1 INSERT, ya escala
en BD), **TypeScript la rechaza en todo el código**. La BD escala pero el código NO.
→ Contradice el pilar "escalable, cero hardcodeo" que aplicamos a la BD.

### 🔴 H-C2 · TRES fuentes de verdad para "correo autorizado"
`allowedEmails.ts` (env vars legado) · `accountStore.esCorreoDePrivada` (demo_llaves) ·
`duenos.instanciaDe` (demo_duenos). El register consulta las 3 en cascada. Debería ser UNA.

### 🔴 H-C3 · SEIS archivos tocan el cupo
`types.MAX_CONCURRENT` (constante legado) · `instancias.cupoDe` (BD ✅) · `userStore` · `store` ·
`accounts` · `accountStore`. Ya cableamos el correcto, pero la constante vieja sigue viva.

### 🟡 H-C4 · DOS caminos para resolver una cuenta
`accounts.resolveByToken` (demo_accounts, legado) vs `accountStore.resolvePrivadaByToken`
(demo_llaves, nuevo). Conviven; la página `[token]` usa el legado.

### 🟡 H-C5 · 13 funciones exportadas sin consumidores
`generarToken`, `getAccount`, `checkAdminPassword`, `allowedEmailFor`, `hasDb`,
`registrarDueno`(⚠️ la del panel pendiente), `listarDuenos`, `getInstancia`, `invalidarCache`,
`invalidarConfig`, `clearDuenoVerificado`, `configInt`/`configTexto` (estos 2 sí se usan internamente).

### 🟡 H-C6 · Legado que sigue enchufado
- `store.ts` (142 líneas): store **EN MEMORIA** (0 ops BD). Sus comentarios hablan de
  `demo_sessions` (tabla ya borrada). Lo usan 4 endpoints (`join/leave/status/heartbeat`) que
  **la UI no llama**. Verificado: no están rotos (405/400), pero son peso muerto.
- `accounts.ts` (93): usa `demo_accounts`, tabla **suelta (0 FKs)**.
- `allowedEmails.ts` (33): correos por env var, reemplazado por `demo_duenos`.
- `email.ts` (21): **STUB**, no manda correos (el aviso de cupo nunca llega).
- `container.ts` (46): **NO-OP**, env var muerta (encender/apagar agente no funciona).

### 🟡 H-C7 · Hardcodeo menor restante
`for3s-demo-<instancia>` (nombre de contenedor, 3 sitios) · `OAUTH_KINDS` lista fija ·
`SESSION_TTL_MS` en `store.ts` · URL del Funnel como fallback (aceptable, es red de seguridad).

---

## 2 · LOS 4 PILARES (los mismos de la BD, aplicados al código)
1. **Una sola fuente de verdad** por concepto (cupo, autorización, canal) — no 3 ni 6.
2. **Cero hardcodeo**: instancias/topes/URLs salen de la BD; el tipo no puede ser una lista fija.
3. **Sin código muerto**: lo que no se usa, se borra (no se comenta "por si acaso").
4. **Un camino por operación**: nada de legado y nuevo conviviendo sin fecha de corte.

---

## 3 · FASES PROPUESTAS (una por vez, verificar antes de avanzar)
- **P1 · `DemoKind` deja de ser lista fija** → `type DemoKind = string` (validado contra
  `demo_instancias` en runtime). Desbloquea el escalado real. Toca 27 archivos pero es mecánico.
- **P2 · Una sola autorización** → unificar allowedEmails/esCorreoDePrivada/instanciaDe en un
  `puedeEntrar(email, instancia)` que consulte solo la BD nueva.
- **P3 · Un solo cupo** → borrar `MAX_CONCURRENT` de types; todo por `cupoDe()`.
- **P4 · Retirar legado** → `store.ts` + sus 4 endpoints, `accounts.ts`, `allowedEmails.ts`
  (previa confirmación de que nada los necesita).
- **P5 · Código muerto** → borrar las funciones sin consumidores (salvo `registrarDueno`, que
  espera el panel admin pendiente).
- **P6 · Hardcodeo menor** → nombre de contenedor y OAUTH_KINDS desde la BD.
> Cada fase: `bun run build` verde + prueba E2E en la demo real + evidencia.

---

## 4 · DECISIONES QUE NECESITO DE BRIAN
| # | Decisión | Propuesta |
|---|---|---|
| D-C1 | ¿Los 4 endpoints legado (`join/leave/status/heartbeat` raíz) se borran? | Sí, la UI no los llama |
| D-C2 | `email.ts` STUB: ¿se implementa con Resend o se borra la función de aviso? | Implementar (ya hay Resend) |
| D-C3 | `container.ts` NO-OP: ¿se borra o queda esperando la reconstrucción? | Queda (pendiente de Brian) |
| D-C4 | ¿P1 (`DemoKind`) ahora o después? Es el más grande (27 archivos) pero el que más desbloquea | Ahora: sin él la BD escala y el código no |
