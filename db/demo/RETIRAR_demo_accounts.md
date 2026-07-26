# U5 · Qué falta para retirar `demo_accounts` (investigación, NO se borra nada)

> Pieza U5 de la Ronda F0 de `userStore.ts` (`DEMO_RONDA_F0_USERSTORE.md`).
> **Esta pieza no cambia código ni datos.** Deja escrito qué es esa tabla, quién la
> usa y qué haría falta para retirarla — porque C6p2 la lista como "borrar" y tiene
> 6 filas, así que NO es código muerto todavía.

Fecha: 2026-07-26 · verificado contra Neon.

---

## 1 · Qué hay dentro (6 filas, DOS grupos distintos)

### Grupo A — 4 filas de CATÁLOGO (obsoletas ✅)
`kind` ∈ {brian, general, jazz, mashe} · `token=NULL` · creadas 2026-06-17.
Guardan `max_concurrent` y `container_name` por instancia.

**Ya no son fuente de verdad de nada:**
- el cupo vive en `demo_instancias.max_concurrent` (C3, se lee con `cupoDe`)
- el nombre de contenedor se deriva por convención (`types.containerName`, P6)

### Grupo B — 2 filas de PUERTAS 1:1 privadas (⚠️ vivas)
`kind='privado'` · con token, `email_autorizado`, `nombre_persona`, `instancia`.
Creadas 2026-07-23 desde el panel:

| token | instancia | correo | persona |
|---|---|---|---|
| `p-3XRCVK…` | mashe | paco@gmail.com | HOLA |
| `p-ffaKSx…` | brian | pato@gmail.com | PATO |

## 2 · ⭐ `demo_llaves` YA cubre el grupo B
Las MISMAS 2 puertas están en `demo_llaves` (doble escritura C4), con los mismos
tokens y correos, **y además con la columna `revocada`** que `demo_accounts` no tiene.
`esCorreoDePrivada` (accountStore.ts:155) ya lee de `demo_llaves` respetando la
revocación. Así que la tabla vieja es un espejo sin la mejora.

## 3 · Quién la toca todavía (3 sitios)
| Sitio | Qué hace | ¿Bloquea el borrado? |
|---|---|---|
| `accountStore.ts:191` | **INSERT** (doble escritura C4) | 🔴 sí — hay que quitar la escritura primero |
| `userStore.ts:572` | **DELETE** al eliminar una persona (`eliminarUsuario`) | 🔴 sí |
| `accounts.ts` | comentarios + camino LEGADO por env var | 🟡 revisar |

**Ningún FK apunta a `demo_accounts`** (verificado) → borrarla no rompe integridad
referencial. El bloqueo es solo de código.

## 4 · Pasos para retirarla (ronda futura, NO ahora)
1. **Dejar de escribirla:** quitar el INSERT de `accountStore.ts:191` (la llave ya se
   escribe en `demo_llaves`) y el DELETE de `userStore.ts:572`.
2. **Dejarla correr en sombra** un tiempo: verificar que nada nuevo entra y que
   `demo_llaves` cubre el 100% de los accesos privados.
3. **Confirmar que el grupo B está completo** en `demo_llaves` (hoy: 2 de 2 ✅).
4. `DROP TABLE demo_accounts` en una migración con respaldo previo de las 6 filas.

## 5 · ⚠️ Hallazgo aparte (seguridad, no es de esta ronda)
Las 2 llaves del grupo B están **`revocada=false`**, o sea VIGENTES. Salieron de
pruebas del 23-jul con correos de ejemplo (`paco@`, `pato@`). En particular
**`pato@gmail.com` tiene acceso de invitado a `brian`, la instancia PERSONAL de
Brian.** Si fueron pruebas, conviene revocarlas:

```sql
UPDATE demo_llaves SET revocada = true
WHERE email_autorizado IN ('paco@gmail.com','pato@gmail.com');
```
Decisión de Brian — aquí solo queda registrado.
