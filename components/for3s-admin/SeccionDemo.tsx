"use client";

import { useEffect, useState } from "react";
import type { DemoUser } from "@/lib/demo/types";

/**
 * Sección "Demo" del panel admin unificado (pieza E, 2026-07-20).
 * Absorbe el antiguo /demo-admin: registros y lista de espera de la demo General.
 *
 * Auth: la MISMA que tenía el /demo-admin cuando funcionaba — contraseña
 * (DEMO_ADMIN_PASSWORD, ya configurada en Vercel) por header X-Admin-Password.
 * Se pide UNA vez y se guarda en sessionStorage mientras dure la pestaña.
 * ⚠️ 2026-07-21: intenté cambiarla por "validar el token del panel contra el
 * server" y eso ROMPIÓ la sección en Vercel (ese endpoint es tailnet-only, ver
 * lib/demo/admin.ts). Mover el componente al panel NO requería tocar la auth.
 *
 * Los datos vienen de la BD for3s_demo vía /api/demo/admin/users (rutas del sitio,
 * distinto backend que las demás secciones, que van al server For3s directo).
 */
const PASS_KEY = "for3s_demo_admin_pass";

interface Counts {
  total: number;
  active: number;
  waiting: number;
  maxConcurrent: number;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  waiting: "En espera",
  released: "Inactivo",
  connecting: "Registrando",
  ready: "Listo",
};

// Instancias a las que una demo 1:1 privada puede apuntar (lista fija).
// Debe coincidir con INSTANCIAS en lib/demo/accountStore.ts. 'foresito' NO está:
// es la instancia interna de la empresa, no demo-able (Brian 2026-07-22).
const INSTANCIAS = ["general", "jazz", "mashe", "brian"] as const;

// Color de la etiqueta de demo, para identificar de un vistazo (Brian 2026-07-22):
// jazz morado · mashe verde · brian amarillo · general gris. Tintes suaves con
// buen contraste en dark, sin gritar. Clases estáticas (Tailwind no purga strings
// concatenados). Cada demo: [borde, fondo, texto].
const DEMO_COLOR: Record<string, string> = {
  jazz: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  mashe: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  brian: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  general: "border-edge-secondary bg-surface-primary text-foreground-secondary",
};

function demoColor(kind: string): string {
  return DEMO_COLOR[kind] ?? DEMO_COLOR.general;
}

// Etiqueta de demo coloreada. Si el demo mostrado (kindUi) difiere del real,
// marca el mockup con un asterisco + tooltip (la verdad vive en Neon).
function DemoBadge({ kindUi, kindReal }: { kindUi: string; kindReal: string }) {
  const esMock = kindUi !== kindReal;
  return (
    <span
      title={esMock ? `Mostrado como ${kindUi}. Real (hilo): ${kindReal}. Cambio simulado.` : undefined}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono uppercase ${demoColor(kindUi)}`}
    >
      {kindUi}
      {esMock && <span className="not-italic text-current opacity-70">*</span>}
    </span>
  );
}

export default function SeccionDemo() {
  const [users, setUsers] = useState<DemoUser[] | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState("");
  // Lee la contraseña guardada en el 1er render (lazy init: sin efecto, sin
  // cascading-render). sessionStorage solo existe en el cliente; el componente
  // es "use client" y el guard de typeof cubre el render del servidor.
  const [pass, setPass] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.sessionStorage.getItem(PASS_KEY),
  );
  const [passInput, setPassInput] = useState("");
  const [passMala, setPassMala] = useState(false);

  // --- Formulario "Agregar" (persona 1:1 privada o general) ---
  const [abierto, setAbierto] = useState(false);
  const [fNombre, setFNombre] = useState("");
  const [fCorreo, setFCorreo] = useState("");
  const [fPrivada, setFPrivada] = useState(true); // arranca en 1:1 privada
  const [fInstancia, setFInstancia] = useState<string>("general");
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [okGeneral, setOkGeneral] = useState<{ nombre: string; yaExistia: boolean } | null>(null);

  // --- Filtro por instancia + edición de persona ---
  const [filtro, setFiltro] = useState<string>("todos"); // "todos" | jazz | mashe | brian | general
  const [editando, setEditando] = useState<DemoUser | null>(null); // fila en edición (modal)

  const ERRORES: Record<string, string> = {
    nombre_requerido: "Falta el nombre de la persona.",
    correo_invalido: "Ese correo no se ve válido.",
    instancia_invalida: "Elige una instancia válida.",
    correo_ya_existe: "Ya existe una demo 1:1 con ese correo.",
    error_guardando: "No se pudo guardar. Intenta de nuevo.",
  };

  function resetForm() {
    setFNombre("");
    setFCorreo("");
    setFPrivada(true);
    setFInstancia("general");
    setFormError("");
    setLinkGenerado(null);
    setCopiado(false);
    setOkGeneral(null);
  }

  async function agregar() {
    if (!pass) return;
    setFormError("");
    setLinkGenerado(null);
    setOkGeneral(null);
    setGuardando(true);
    try {
      const res = await fetch("/api/demo/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pass },
        body: JSON.stringify({
          tipo: fPrivada ? "privado" : "general",
          nombre: fNombre.trim(),
          email: fCorreo.trim(),
          instancia: fInstancia,
        }),
      });
      const data = (await res.json()) as {
        link?: string;
        tipo?: string;
        yaExistia?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setFormError(ERRORES[data.error ?? ""] ?? "No se pudo guardar.");
        return;
      }
      if (data.tipo === "general") {
        setOkGeneral({ nombre: fNombre.trim(), yaExistia: !!data.yaExistia });
      } else if (data.link) {
        setLinkGenerado(`${window.location.origin}${data.link}`);
      } else {
        setFormError("Respuesta inesperada del servidor.");
      }
    } catch {
      setFormError("No llegué al backend. Revisa la conexión.");
    } finally {
      setGuardando(false);
    }
  }

  async function copiarLink() {
    if (!linkGenerado) return;
    try {
      await navigator.clipboard.writeText(linkGenerado);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* si el navegador bloquea el portapapeles, el link ya está visible para copiar a mano */
    }
  }

  // Guarda la edición de una persona. `cuerpo` puede ser datos reales
  // ({name, email}) o el mockup de demo ({demoUi}). Devuelve el código de error
  // del backend (o null si salió bien) para que el modal lo muestre.
  async function guardarEdicion(
    id: string,
    cuerpo: { name?: string; email?: string; demoUi?: string },
  ): Promise<string | null> {
    if (!pass) return "sin_sesion";
    try {
      const res = await fetch(`/api/demo/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": pass },
        body: JSON.stringify(cuerpo),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return res.ok ? null : data.error ?? "error";
    } catch {
      return "sin_red";
    }
  }

  // Auto-refresca cada 5s mientras haya contraseña. Cancela con un flag al
  // desmontar (evita setState sobre componente desmontado tras el await).
  useEffect(() => {
    if (!pass) return;
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/demo/admin/users", {
          headers: { "x-admin-password": pass },
        });
        if (!alive) return;
        if (res.status === 401) {
          // contraseña equivocada → volver a pedirla (y no dejarla guardada)
          window.sessionStorage.removeItem(PASS_KEY);
          setPass(null);
          setPassMala(true);
          return;
        }
        if (!res.ok) {
          setError("No pude cargar los registros de la demo.");
          return;
        }
        const data = (await res.json()) as { users: DemoUser[]; counts: Counts };
        if (!alive) return;
        setUsers(data.users);
        setCounts(data.counts);
        setError("");
      } catch {
        if (alive) setError("No llego al backend de la demo.");
      }
    };

    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pass]);

  function entrar() {
    const p = passInput.trim();
    if (!p) return;
    window.sessionStorage.setItem(PASS_KEY, p);
    setPass(p);
    setPassInput("");
    setPassMala(false);
  }

  // Gate: sin contraseña, pide la del demo-admin (la de siempre).
  if (!pass) {
    return (
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-foreground-active mb-1">
          Demo General · Personas
        </h2>
        <p className="text-sm text-foreground-secondary mb-4">
          Contraseña de la demo para ver los registros.
        </p>
        <input
          type="password"
          value={passInput}
          onChange={(e) => {
            setPassInput(e.target.value);
            if (passMala) setPassMala(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          placeholder="Contraseña"
          className={`w-full rounded-lg bg-surface-primary border px-4 py-3 text-sm text-foreground-active outline-none transition-colors ${
            passMala ? "border-danger" : "border-edge-primary focus:border-brand-bold"
          }`}
        />
        {passMala && <p className="mt-2 text-xs text-danger">Contraseña incorrecta.</p>}
        <button type="button" onClick={entrar} className="btn-pill btn-pill-primary w-full mt-4">
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground-active mb-1">
            Demo · Personas
          </h2>
          <p className="text-sm text-foreground-secondary">
            Registros de la General + demos 1:1 privadas. Se actualiza cada 5 s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (abierto) resetForm();
            setAbierto((v) => !v);
          }}
          className="btn-pill btn-pill-primary shrink-0"
        >
          {abierto ? "Cerrar" : "＋ Agregar"}
        </button>
      </div>

      {abierto && (
        <FormAgregar
          fNombre={fNombre}
          setFNombre={setFNombre}
          fCorreo={fCorreo}
          setFCorreo={setFCorreo}
          fPrivada={fPrivada}
          setFPrivada={setFPrivada}
          fInstancia={fInstancia}
          setFInstancia={setFInstancia}
          guardando={guardando}
          formError={formError}
          linkGenerado={linkGenerado}
          copiado={copiado}
          okGeneral={okGeneral}
          onGuardar={agregar}
          onCopiar={copiarLink}
          onOtra={resetForm}
        />
      )}

      {error && (
        <p className="mb-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {counts && (
        <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-3">
          <Stat label="Total" value={counts.total} />
          <Stat
            label="Activos"
            value={`${counts.active}/${counts.maxConcurrent}`}
          />
          <Stat label="En espera" value={counts.waiting} />
        </div>
      )}

      {/* Filtros por instancia: clasificar quién está en cada demo. El conteo
          usa el demo MOSTRADO (kindUi), que es lo que el admin ve. */}
      {users && users.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(["todos", ...INSTANCIAS] as const).map((f) => {
            const n =
              f === "todos" ? users.length : users.filter((u) => u.kindUi === f).length;
            const activo = filtro === f;
            const color = f === "todos" ? "" : demoColor(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFiltro(f)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono transition-colors ${
                  activo
                    ? f === "todos"
                      ? "border-brand-bold text-brand-bold"
                      : color
                    : "border-edge-primary text-foreground-tertiary hover:text-foreground-secondary"
                }`}
              >
                {f === "todos" ? "Todos" : f}
                <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-edge-primary bg-surface-overlay-large">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-edge-secondary text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
            <tr>
              <th className="px-4 py-3">Demo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Cola</th>
              <th className="px-4 py-3">Registrado</th>
              <th className="px-4 py-3 text-right">Editar</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtrados =
                users === null
                  ? null
                  : filtro === "todos"
                    ? users
                    : users.filter((u) => u.kindUi === filtro);
              if (filtrados !== null && filtrados.length === 0) {
                return (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-foreground-tertiary">
                      {users && users.length > 0
                        ? "Nadie en esta instancia."
                        : "Sin registros todavía."}
                    </td>
                  </tr>
                );
              }
              if (filtrados === null && !error) {
                return (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-foreground-tertiary">
                      Cargando…
                    </td>
                  </tr>
                );
              }
              return (filtrados ?? []).map((u) => (
                <tr key={u.id} className="border-b border-edge-secondary/50">
                  <td className="px-4 py-3">
                    <DemoBadge kindUi={u.kindUi} kindReal={u.kind} />
                  </td>
                  <td className="px-4 py-3 text-foreground-active capitalize">{u.name}</td>
                  <td className="px-4 py-3 text-foreground-secondary font-mono text-xs">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-foreground-tertiary">{u.position ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground-tertiary text-xs">
                    {new Date(u.createdAt).toLocaleString("es-MX")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditando(u)}
                      className="text-xs font-mono text-foreground-tertiary hover:text-brand-bold transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {editando && (
        <ModalEditar
          user={editando}
          onClose={() => setEditando(null)}
          onGuardar={guardarEdicion}
        />
      )}
    </div>
  );
}

// Formulario para dar de alta una persona. General se registra sola al entrar a
// /demo; aquí el caso real es la 1:1 privada: genera token + link para compartir.
function FormAgregar(props: {
  fNombre: string;
  setFNombre: (v: string) => void;
  fCorreo: string;
  setFCorreo: (v: string) => void;
  fPrivada: boolean;
  setFPrivada: (v: boolean) => void;
  fInstancia: string;
  setFInstancia: (v: string) => void;
  guardando: boolean;
  formError: string;
  linkGenerado: string | null;
  copiado: boolean;
  okGeneral: { nombre: string; yaExistia: boolean } | null;
  onGuardar: () => void;
  onCopiar: () => void;
  onOtra: () => void;
}) {
  const {
    fNombre,
    setFNombre,
    fCorreo,
    setFCorreo,
    fPrivada,
    setFPrivada,
    fInstancia,
    setFInstancia,
    guardando,
    formError,
    linkGenerado,
    copiado,
    okGeneral,
    onGuardar,
    onCopiar,
    onOtra,
  } = props;

  const inputCls =
    "w-full rounded-lg bg-surface-primary border border-edge-primary px-3.5 py-2.5 text-sm text-foreground-active outline-none transition-colors focus:border-brand-bold";
  const labelCls =
    "block text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-1.5";

  // Éxito general: la persona quedó dada de alta en la demo General (sin link).
  if (okGeneral) {
    return (
      <div className="mb-8 rounded-2xl border border-brand-bold/40 bg-brand-bold/[0.06] p-5">
        <p className="text-sm font-medium text-foreground-active mb-1">
          {okGeneral.yaExistia ? "Ya estaba registrada" : "Persona agregada a General ✓"}
        </p>
        <p className="text-xs text-foreground-secondary mb-4">
          {okGeneral.yaExistia
            ? `${okGeneral.nombre || "Esa persona"} ya existía en la demo General con ese correo.`
            : `${okGeneral.nombre || "La persona"} entra a la demo General por /demo con su correo. No lleva link privado.`}
        </p>
        <button
          type="button"
          onClick={onOtra}
          className="text-xs font-mono text-foreground-tertiary hover:text-foreground-secondary transition-colors"
        >
          + Agregar otra persona
        </button>
      </div>
    );
  }

  // Estado de éxito: el link ya se generó. Se muestra en lugar del formulario.
  if (linkGenerado) {
    return (
      <div className="mb-8 rounded-2xl border border-brand-bold/40 bg-brand-bold/[0.06] p-5">
        <p className="text-sm font-medium text-foreground-active mb-1">
          Demo 1:1 creada ✓
        </p>
        <p className="text-xs text-foreground-secondary mb-4">
          Comparte este link solo con {fNombre.trim() || "la persona"}. Es su acceso privado.
        </p>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg border border-edge-primary bg-surface-primary px-3 py-2.5 text-xs text-foreground-active font-mono whitespace-nowrap">
            {linkGenerado}
          </code>
          <button type="button" onClick={onCopiar} className="btn-pill btn-pill-primary shrink-0">
            {copiado ? "Copiado ✓" : "Copiar"}
          </button>
        </div>
        <button
          type="button"
          onClick={onOtra}
          className="mt-4 text-xs font-mono text-foreground-tertiary hover:text-foreground-secondary transition-colors"
        >
          + Agregar otra persona
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-edge-primary bg-surface-overlay-large p-5">
      {/* Tipo de demo: segmentado. 1:1 privada es el caso que se maneja aquí. */}
      <div className="mb-5">
        <span className={labelCls}>Tipo de acceso</span>
        <div className="inline-flex rounded-lg border border-edge-primary bg-surface-primary p-0.5">
          {[
            { on: true, label: "1:1 privada" },
            { on: false, label: "General" },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setFPrivada(opt.on)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-mono transition-colors ${
                fPrivada === opt.on
                  ? "bg-brand-bold text-white"
                  : "text-foreground-tertiary hover:text-foreground-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {!fPrivada && (
          <p className="mt-2 text-xs text-foreground-tertiary">
            La agregas a mano a la demo General. También puede entrar sola por{" "}
            <span className="font-mono">/demo</span> con su nombre y correo. No lleva link privado.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="agr-nombre">
            Nombre de la persona
          </label>
          <input
            id="agr-nombre"
            value={fNombre}
            onChange={(e) => setFNombre(e.target.value)}
            placeholder="p. ej. Dora"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="agr-correo">
            Correo autorizado
          </label>
          <input
            id="agr-correo"
            type="email"
            value={fCorreo}
            onChange={(e) => setFCorreo(e.target.value)}
            placeholder="persona@correo.com"
            className={inputCls}
            onKeyDown={(e) => e.key === "Enter" && fPrivada && onGuardar()}
          />
        </div>
      </div>

      {fPrivada && (
        <div className="mt-4 max-w-[15rem]">
          <label className={labelCls} htmlFor="agr-instancia">
            Instancia
          </label>
          <select
            id="agr-instancia"
            value={fInstancia}
            onChange={(e) => setFInstancia(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            {INSTANCIAS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      )}

      {formError && (
        <p className="mt-4 text-sm text-danger" role="alert">
          {formError}
        </p>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando}
          className="btn-pill btn-pill-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando
            ? fPrivada
              ? "Creando…"
              : "Agregando…"
            : fPrivada
              ? "Crear demo 1:1"
              : "Agregar a General"}
        </button>
      </div>
    </div>
  );
}

// Modal de edición de una persona. Dos zonas:
//   1) Datos reales: nombre + correo (se guardan de verdad).
//   2) Cambiar demo (MOCKUP): mueve solo la etiqueta mostrada (kind_ui). Avisa
//      claramente que el hilo NO se mueve (migrar hilos = pendiente a futuro).
function ModalEditar({
  user,
  onClose,
  onGuardar,
}: {
  user: DemoUser;
  onClose: () => void;
  onGuardar: (
    id: string,
    cuerpo: { name?: string; email?: string; demoUi?: string },
  ) => Promise<string | null>;
}) {
  const [nombre, setNombre] = useState(user.name);
  const [correo, setCorreo] = useState(user.email);
  const [demoUi, setDemoUi] = useState<string>(user.kindUi);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const ERR: Record<string, string> = {
    correo_invalido: "Ese correo no se ve válido.",
    nombre_invalido: "El nombre no puede ir vacío.",
    correo_ya_existe: "Otra persona de este demo ya usa ese correo.",
    no_existe: "Esa persona ya no existe (recarga).",
    demo_invalido: "Demo no válido.",
    sin_red: "No llegué al backend.",
    sin_sesion: "Sesión expirada, vuelve a entrar.",
  };

  const inputCls =
    "w-full rounded-lg bg-surface-primary border border-edge-primary px-3.5 py-2.5 text-sm text-foreground-active outline-none transition-colors focus:border-brand-bold";
  const labelCls =
    "block text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-1.5";

  const cambioDatos =
    nombre.trim().toLowerCase() !== user.name || correo.trim().toLowerCase() !== user.email;
  const cambioDemo = demoUi !== user.kindUi;

  async function guardar() {
    setMsg("");
    setOk("");
    setBusy(true);
    try {
      // Datos reales primero (si cambiaron).
      if (cambioDatos) {
        const e = await onGuardar(user.id, { name: nombre.trim(), email: correo.trim() });
        if (e) {
          setMsg(ERR[e] ?? "No se pudo guardar.");
          return;
        }
      }
      // Luego el mockup de demo (si cambió).
      if (cambioDemo) {
        const e = await onGuardar(user.id, { demoUi });
        if (e) {
          setMsg(ERR[e] ?? "No se pudo cambiar el demo.");
          return;
        }
      }
      setOk("Guardado. La tabla se actualiza en unos segundos.");
      window.setTimeout(onClose, 900);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-foreground-active mb-1">Editar persona</h3>
        <p className="text-xs text-foreground-tertiary mb-5 font-mono">
          Real (hilo): <span className={`${demoColor(user.kind)} px-1.5 py-0.5 rounded`}>{user.kind}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="ed-nombre">Nombre</label>
            <input id="ed-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="ed-correo">Correo</label>
            <input id="ed-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={inputCls} />
          </div>

          {/* Cambiar demo — MOCKUP */}
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-3.5">
            <label className={labelCls} htmlFor="ed-demo">Demo mostrado (simulado)</label>
            <select
              id="ed-demo"
              value={demoUi}
              onChange={(e) => setDemoUi(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              {INSTANCIAS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-relaxed text-foreground-tertiary">
              Cambia solo la etiqueta que se ve. El hilo del agente NO se mueve (Neon
              guarda el real aparte). Migrar hilos entre agentes es un pendiente a futuro.
            </p>
          </div>
        </div>

        {msg && <p className="mt-4 text-sm text-danger" role="alert">{msg}</p>}
        {ok && <p className="mt-4 text-sm text-foreground-accent">{ok}</p>}

        <div className="mt-6 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-pill border border-edge-primary text-foreground-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={busy || (!cambioDatos && !cambioDemo)}
            className="btn-pill btn-pill-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-edge-primary bg-surface-primary p-4">
      <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground-active">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  const isWaiting = status === "waiting";
  const cls = isActive
    ? "bg-brand-bold/15 text-foreground-accent border-brand-bold/30"
    : isWaiting
      ? "bg-surface-primary text-foreground-secondary border-edge-primary"
      : "bg-surface-primary text-foreground-tertiary border-edge-secondary";
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-mono ${cls}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
