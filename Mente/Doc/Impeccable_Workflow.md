# Protocolo Impeccable para marca-personal

**Repo:** `marca-personal/`
**Owner:** Brian Lopez
**Fecha:** 2026-06-03
**Estatus:** Activo
**Scope:** Uso de `impeccable` para diseno, UI, UX, auditoria visual y polish del sitio publico.

---

## 1. Decision

En `marca-personal`, cualquier trabajo de diseno, UI, UX, layout, polish, auditoria visual, adaptacion responsive, copy UX, estados de interfaz, motion, color, tipografia o deteccion de "AI slop" debe usar el flujo de `impeccable`.

Esto no reemplaza las reglas de Brian. Las refuerza:

1. Primero se lee `Mente/Doc/README.md`.
2. Luego se lee `Mente/Doc/Estado_Sesion_Continuidad.md`.
3. Luego se revisan `PRODUCT.md` y `DESIGN.md`.
4. Si la tarea toca interfaz, se activa el protocolo `impeccable`.
5. Se pregunta, se discute, se evalua y solo despues se ejecuta.

---

## 2. Estado de instalacion

El skill ya esta instalado localmente en este repo:

- `.claude/skills/impeccable/SKILL.md`
- `.claude/skills/impeccable/reference/`
- `.claude/skills/impeccable/scripts/`
- `skills-lock.json` apunta a `pbakaus/impeccable`

No reinstalar si esos archivos existen.

Si no existiera en una futura copia del repo, el comando canonico documentado por `impeccable.style` es:

```bash
npx impeccable skills install
```

Comandos utiles del ecosistema:

```bash
npx impeccable skills check
npx impeccable skills update
npx impeccable detect .
```

Nota: instalar o actualizar herramientas requiere permiso de Brian si implica red, cambios de archivos o nuevas dependencias.

---

## 3. Que aporta Impeccable

Segun la referencia publica de `impeccable.style`, la herramienta existe para que los agentes no generen frontend generico por defecto. Opera con:

- Vocabulario de diseno compartido.
- Lectura de `PRODUCT.md`.
- Lectura de `DESIGN.md`.
- Comandos por disciplina: `shape`, `craft`, `audit`, `polish`, `typeset`, `colorize`, `layout`, `adapt`, `animate`, `clarify`, etc.
- Deteccion deterministica de anti-patrones visuales.
- Modo live para iterar sobre una app corriendo y aceptar variantes como diffs reales.

Para este repo, la interpretacion es:

- `PRODUCT.md` manda en estrategia, audiencia, voz y anti-referencias.
- `DESIGN.md` manda en tokens, color, tipografia, layout, componentes y motion.
- `Mente/Doc/Estado_Sesion_Continuidad.md` manda en continuidad, estado actual y reglas de Brian.
- `impeccable` manda en el metodo de analisis/ejecucion de interfaz.

---

## 4. Cuándo usarlo

Usar `impeccable` si la tarea menciona o implica:

- Estilo visual.
- Secciones de landing.
- Hero.
- Navbar.
- Footer.
- Demo page.
- Docs UI.
- Layout.
- Espaciado.
- Responsive.
- Accesibilidad visual.
- Estados vacios, loading, error o success.
- Motion o micro-interacciones.
- Tono de interfaz o UX copy.
- Auditoria visual o tecnica de UI.
- Deteccion de "AI slop".
- Pulido final antes de release.

No es necesario para:

- Cambios puramente backend.
- Ajustes de metadata sin impacto visual.
- Correcciones TypeScript sin UI.
- Scripts internos sin superficie.
- Cambios en `Mente/` que solo documenten decisiones.

---

## 5. Preflight obligatorio antes de editar UI

Antes de editar archivos de interfaz, el agente debe poder declarar:

```text
IMPECCABLE_PREFLIGHT:
context=pass
product=pass
design=pass
command_reference=pass|not_required
shape=pass|not_required
image_gate=pass|skipped:<reason>
mutation=open
```

Definiciones:

- `context=pass`: ya leyo `Mente/Doc/README.md` y `Estado_Sesion_Continuidad.md`.
- `product=pass`: ya leyo `PRODUCT.md`.
- `design=pass`: ya leyo `DESIGN.md`.
- `command_reference=pass`: si usa un comando especifico, leyo su archivo en `.claude/skills/impeccable/reference/`.
- `shape=pass`: si la tarea es construccion nueva o redireccion visual mayor, Brian aprobo un brief antes de implementar.
- `image_gate`: si aplica exploracion visual, se uso o se justifico por que no.
- `mutation=open`: Brian ya aprobo ejecutar cambios.

Si no puede declarar eso, no debe tocar UI.

---

## 6. Mapeo de tareas a comandos

| Necesidad | Comando recomendado | Resultado esperado |
|---|---|---|
| Pensar una nueva seccion antes de construir | `impeccable shape [feature]` | Brief aprobado por Brian |
| Construir una seccion completa | `impeccable craft [feature]` | Implementacion guiada por brief |
| Revisar calidad tecnica de UI | `impeccable audit [target]` | Reporte, no fixes automaticos |
| Pulir una superficie casi lista | `impeccable polish [target]` | Ajustes finos de calidad |
| Mejorar jerarquia tipografica | `impeccable typeset [target]` | Tipografia mas clara y consistente |
| Revisar layout/espaciado | `impeccable layout [target]` | Ritmo, estructura, alineacion |
| Ajustar responsive | `impeccable adapt [target]` | Mobile/tablet/desktop solidos |
| Mejorar copy de interfaz | `impeccable clarify [target]` | Copy mas claro y accionable |
| Quitar look generico o "AI slop" | `impeccable critique` o `detect` | Findings y prioridades |
| Iterar visualmente sobre app corriendo | `impeccable live` | Variantes aceptables como diff |

---

## 7. Reglas especificas para For3s

Impeccable no puede contradecir estas reglas:

1. Light mode = B2B institucional, verde `--brand-bold`.
2. Dark mode = B2C builder, ambar `--brand-bold`.
3. No colores hardcoded en componentes.
4. No gradient text.
5. No glassmorphism decorativo.
6. No hero metric template.
7. No side-stripe borders como acento.
8. No card grids genericos si la informacion pide otra estructura.
9. No em dashes en copy nuevo.
10. No `leverage`, `empower`, `unlock`.
11. No modificar textos sin permiso de Brian.
12. No modificar `PRODUCT.md` ni `DESIGN.md` sin permiso explicito.

Si el output de `impeccable` sugiere algo que rompa esto, se rechaza o se adapta.

---

## 8. Relacion con Mente/

`impeccable` ejecuta trabajo de interfaz.
`Mente/` preserva decisiones y aprendizaje.

Cuando una ejecucion de `impeccable` deje una decision duradera:

- Conviccion de marca -> `Mente/Alma/`
- Analisis UX, audiencia, patron o anti-patron -> `Mente/Cerebro/`
- Plan de implementacion aprobado -> `Mente/Cuerpo/`
- Cambio de gobierno, protocolo o continuidad -> `Mente/Doc/`

Siempre actualizar `Mente/Doc/Estado_Sesion_Continuidad.md` si:

- Cambia el estado real del sitio.
- Se cierra un finding.
- Se actualiza `AUDIT.md`.
- Se modifica `PRODUCT.md` o `DESIGN.md`.
- Se instala, actualiza o cambia el protocolo de `impeccable`.

---

## 9. Verificacion despues de cambios UI

Despues de aplicar cambios de interfaz:

```bash
bun run lint
bun run build
```

Si se uso live mode o se cambio layout visualmente, tambien se debe revisar en browser antes de cerrar.

Si hay errores por red relacionados con Google Fonts durante build en sandbox, repetir `bun run build` con permiso de red. No cambiar fonts por ese motivo sin discutirlo.

---

## 10. Regla final

Impeccable es una herramienta de criterio, no una autoridad superior a Brian.

El orden correcto es:

```text
Brian decide.
Mente preserva.
PRODUCT/DESIGN anclan.
Impeccable ayuda a ejecutar con calidad.
Bun verifica.
```

