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

## 4 · LO QUE **NO** SE HACE EN ESTA RONDA (decidido)
- ❌ **Mover la lógica de negocio a Postgres** (funciones/triggers): rinde, pero vuelve el sistema
  difícil de versionar, probar y depurar. La config va en la BD; la LÓGICA se queda en código.
- ❌ Reescribir `userStore.ts` desde cero. Se optimiza lo medido, se conserva lo que funciona.
- ❌ Cambiar el modelo de datos. La BD ya está bien; esto es solo cómo se consulta.

---

## 5 · ORDEN SUGERIDO
`O-F1` → `O-F2` → `O-F3` (los tres baratos y de bajo riesgo, ~70% de la ganancia) →
`O-F4` → `O-F5` (los de más impacto, con medición cuidadosa) → `O-F6` cuando escale de verdad.
