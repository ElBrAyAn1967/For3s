# ⚡ PLAN DE OPTIMIZACIÓN — de "funciona" a PRODUCTO

> **Contexto:** la demo FUNCIONA y la BD ya es de producto (fuente única de verdad, FKs, cero
> hardcodeo, verificada 7/7 + 8/8 + 6/6). El problema ahora es **cómo está construido el código**:
> paga mucho por operación y no aguanta escala. Esto NO es reescribir: es volverlo eficiente.
>
> **Brian 2026-07-25:** *"la idea de optimizar no es romper lo que tenemos, sino volverlo producto"*.

---

## 0 · ⛔ REGLA MADRE: NO ROMPER (se aplica a TODAS las fases)

Ninguna optimización vale si rompe algo que hoy funciona. Reglas duras de esta ronda:

1. **Sin cambios de comportamiento observable.** El usuario final NO debe notar diferencia (salvo
   que va más rápido). Mismas respuestas, mismos estados, mismos errores.
2. **Contrato intacto.** No se cambian firmas públicas ni el shape de las respuestas de la API.
   Si una función devuelve `RegisterResult`, sigue devolviendo exactamente eso.
3. **Una fase = un commit = una verificación.** Nunca dos optimizaciones mezcladas: si algo falla,
   se sabe exactamente cuál fue y se revierte sola.
4. **Antes/después medido.** Cada fase declara qué mejora (round-trips, ms) y se COMPRUEBA. Sin
   medición no hay optimización, hay fe.
5. **Batería obligatoria por fase:** `bun run build` verde + prueba E2E en la demo real (entrar,
   verificar código, chatear, key f3k_, refrescar) + integridad de BD (los 7 checks) + evidencia
   en Neon. NO se avanza sin ✅ en todo.
6. **Nada de micro-optimización especulativa.** Solo se toca lo MEDIDO como caro. Si no aparece en
   los números, no se toca.
7. **Reversible.** Cada fase debe poder revertirse con un `git revert` limpio, sin migración de datos.
8. **La red de seguridad se conserva.** Los fallbacks (env, defaults, semillas) siguen ahí hasta
   que el reemplazo esté probado en producción real.

---

## 1 · DIAGNÓSTICO MEDIDO (el porqué)

### Costo actual por operación (round-trips a Neon)
| Operación | Viajes | Frecuencia |
|---|---|---|
| `registerOrResume` | ~12 | al entrar |
| `touch` (heartbeat) | ~11 | **cada 5 s por usuario** |

### Impacto a escala (solo heartbeats)
```
  10 usuarios →    22 queries/seg
 100 usuarios →   220 queries/seg
1000 usuarios → 2,200 queries/seg
```
Neon cobra por cómputo: esto es gasto directo en latidos que casi nunca cambian nada.

### Los 4 patrones que lo causan
| # | Patrón | Evidencia |
|---|---|---|
| O1 | **N+1** en `promote`: un `UPDATE` por persona promovida | bucle `for (const w of waiting)` |
| O2 | **Trabajo inútil**: `reapStale`+`promote` corren SIEMPRE, aunque no haya cola ni sesiones muertas | 8 llamadas incondicionales |
| O3 | **Consultas repetidas** en la misma operación: `cupoDe` 4×, `activeCount` 3× | mismo dato, varios viajes |
| O4 | **Caché inútil en serverless**: `new Map()` por proceso; Vercel recicla procesos → casi siempre falla | `instancias.ts`, `config.ts` |

---

## 2 · FASES (cada una independiente y reversible)

### ⚡ O-F1 · Matar el N+1 de `promote`
Un solo `UPDATE ... WHERE id = ANY(...)` en vez de uno por persona.
**Gana:** con 10 en cola, 10 viajes → 1. **Riesgo:** bajo (misma semántica, SQL equivalente).

### ⚡ O-F2 · No trabajar si no hay nada que hacer
`reapStale` y `promote` solo se ejecutan si HAY algo que limpiar/promover (se comprueba con el
dato que ya se tiene en la operación, sin query extra).
**Gana:** el heartbeat típico (99% de los casos) baja de ~11 a ~4 viajes. **Riesgo:** bajo.

### ⚡ O-F3 · Un solo dato por operación (memoización por request)
`cupoDe`/`activeCount` se resuelven UNA vez por operación y se reusan, en vez de re-consultar.
**Gana:** −4 a −6 viajes por operación. **Riesgo:** bajo (mismo valor dentro de una transacción).

### ⚡ O-F4 · Fusionar las lecturas de `buildResult`
Hoy: SELECT persona + activeCount + cupoDe = 3 viajes. Se puede resolver en **1 query** con un CTE.
**Gana:** −2 viajes en CADA operación. **Riesgo:** medio (query nueva; se valida con datos reales).

### ⚡ O-F5 · Heartbeat barato (el que más pesa a escala)
El latido no necesita recalcular cola ni cupo cada 5 s. Propuesta: `touch` hace solo lo esencial
(marcar visto + devolver estado) y el mantenimiento (reap/promote) se ejecuta **con menor
frecuencia** (ej. 1 de cada N latidos o si pasó X tiempo).
**Gana:** de ~11 a **1-2 viajes** por latido → el 90% del tráfico a Neon desaparece.
**Riesgo:** medio (cambia CUÁNDO se limpia, no QUÉ). Se mide que el cupo siga liberándose bien.

### ⚡ O-F6 · Caché que sirva en serverless (opcional, para después)
La caché en memoria no acierta en Vercel. Opciones: caché por request (`React.cache`) o un store
compartido (Upstash/Redis) para el estado vivo.
**Gana:** config/instancias dejan de golpear Neon en cada request frío.
**Riesgo:** medio-alto (infra nueva) → **solo cuando haya usuarios reales que lo justifiquen**.

---

## 3 · RESULTADO ESPERADO
| | Hoy | Tras O-F1..O-F5 |
|---|---|---|
| `registerOrResume` | ~12 viajes | **~4** |
| `touch` (heartbeat) | ~11 viajes | **~2** |
| 100 usuarios (heartbeat) | 220 q/s | **~40 q/s** |

---

## 3-BIS · HALLAZGO: HTTP QUERY (RFC 10008) — NO viable en Next 16 ❌

Brian pidió evaluar el método **QUERY** (RFC 10008 + repo midudev/query-http-demo) como vía para
optimizar la capa navegador↔servidor. **Verificado contra la doc de Next 16 instalada**
(`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`):

> *"The following HTTP methods are supported: GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.
> **If an unsupported method is called, Next.js will return a 405 Method Not Allowed**."*

**`QUERY` no está en la lista → devolvería 405.** Por eso el repo demo de midudev usa Express 5 +
Node 26: un stack donde se pueden manejar métodos arbitrarios. **Descartado por ahora**; reevaluar
cuando Next lo soporte de forma nativa.

### Lo que SÍ sacamos de esa investigación (la doc lo dice explícito)
> *"Route Handlers are not cached by default. You can opt into caching for **GET** methods.
> Other supported HTTP methods are **not** cached."*

En Next **solo `GET` es cacheable**. Entonces el criterio de "clasificar lecturas vs escrituras"
sigue siendo válido, pero se aplica con GET/POST, no con QUERY:

| Endpoint | Hoy | Qué es de verdad | Acción |
|---|---|---|---|
| `/check-dueno` | POST | **consulta pura** (solo lee demo_duenos) | 🟢 pasar a **GET** → cacheable |
| `/general/keys` (listar) | GET | consulta | ✅ ya correcto |
| `/general/heartbeat` | POST | **mixto**: consulta estado PERO escribe `last_seen_at` | ⚠️ NO es consulta pura → lo arregla O-F5, no el método |
| `/register` `/chat` `/apikey` `/verify/*` | POST | modifican estado | ✅ correcto como POST |

### ⚡ O-F7 · `check-dueno` — ❌ CERRADA: se queda en POST (decisión Brian 2026-07-25)
Es el único endpoint que es consulta pura, y en Next solo los GET se cachean, así que GET sería
"más correcto". **Se queda en POST a propósito:** con GET el CORREO viajaría en la query string y
quedaría en logs de Vercel/CDN y en el historial del navegador — es un dato personal. La ganancia
de caché era marginal (se llama una vez al entrar, no en bucle) → **la privacidad pesa más**.
Documentado en el propio `route.ts` para que nadie lo "corrija" después sin resolver eso.

---

## 4 · LO QUE **NO** SE HACE EN ESTA RONDA (decidido)
- ❌ **HTTP QUERY**: Next 16 responde 405 (ver §3-BIS). Reevaluar cuando haya soporte nativo.
- ❌ **Mover la lógica de negocio a Postgres** (funciones/triggers): rinde, pero vuelve el sistema
  difícil de versionar, probar y depurar. La config va en la BD; la LÓGICA se queda en código.
- ❌ Reescribir `userStore.ts` desde cero. Se optimiza lo medido, se conserva lo que funciona.
- ❌ Cambiar el modelo de datos. La BD ya está bien; esto es solo cómo se consulta.

---

## 5 · ORDEN SUGERIDO
`O-F1` → `O-F2` → `O-F3` (los tres baratos y de bajo riesgo, ~70% de la ganancia) →
`O-F4` → `O-F5` (los de más impacto, con medición cuidadosa) → `O-F6` cuando escale de verdad.
