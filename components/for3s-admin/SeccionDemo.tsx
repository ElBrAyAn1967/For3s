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
      <h2 className="text-lg font-semibold text-foreground-active mb-1">
        Demo General · Personas
      </h2>
      <p className="text-sm text-foreground-secondary mb-6">
        Registros y lista de espera. Se actualiza cada 5 s.
      </p>

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

      <div className="overflow-x-auto rounded-2xl border border-edge-primary bg-surface-overlay-large">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-edge-secondary text-[11px] font-mono uppercase tracking-widest text-foreground-tertiary">
            <tr>
              <th className="px-4 py-3">Demo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Cola</th>
              <th className="px-4 py-3">Notificado</th>
              <th className="px-4 py-3">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {users !== null && users.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-foreground-tertiary"
                >
                  Sin registros todavía.
                </td>
              </tr>
            )}
            {users === null && !error && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-foreground-tertiary"
                >
                  Cargando…
                </td>
              </tr>
            )}
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-edge-secondary/50">
                <td className="px-4 py-3">
                  <span className="inline-block rounded-md border border-edge-secondary bg-surface-primary px-2 py-0.5 text-[11px] font-mono uppercase text-foreground-secondary">
                    {u.kind}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground-active capitalize">
                  {u.name}
                </td>
                <td className="px-4 py-3 text-foreground-secondary font-mono text-xs">
                  {u.email}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3 text-foreground-tertiary">
                  {u.position ?? "—"}
                </td>
                <td className="px-4 py-3 text-foreground-tertiary">
                  {u.notified ? "✓" : "—"}
                </td>
                <td className="px-4 py-3 text-foreground-tertiary text-xs">
                  {new Date(u.createdAt).toLocaleString("es-MX")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
