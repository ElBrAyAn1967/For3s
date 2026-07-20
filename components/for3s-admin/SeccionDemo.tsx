"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/for3sAdmin";
import type { DemoUser } from "@/lib/demo/types";

/**
 * Sección "Demo" del panel admin unificado (pieza E, 2026-07-20).
 * Absorbe el antiguo /demo-admin: registros y lista de espera de la demo General.
 *
 * Auth: NO tiene login propio — vive dentro de PanelDashboard, que ya autenticó
 * el token en el navegador (arquitectura tailnet-only, ver lib/for3sAdmin.ts).
 * Los datos vienen de la BD for3s_demo vía /api/demo/admin/users (rutas del sitio,
 * distinto backend que las demás secciones que van al server For3s directo).
 */

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

  // Auto-refresca cada 5s mientras la pestaña está montada. Cancela con un flag
  // al desmontar (evita setState sobre componente desmontado tras el await).
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        // mismo token de control del panel (una sola llave, pieza E) → el endpoint
        // lo valida server-side contra el server For3s.
        const res = await fetch("/api/demo/admin/users", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!alive) return;
        if (!res.ok) {
          setError(
            res.status === 401
              ? "Sesión no autorizada para la demo."
              : "No pude cargar los registros de la demo.",
          );
          return;
        }
        const data = (await res.json()) as { users: DemoUser[]; counts: Counts };
        if (!alive) return;
        setUsers(data.users);
        setCounts(data.counts);
        setError("");
      } catch {
        if (alive) setError("No llego al backend de la demo (¿tailnet?).");
      }
    };

    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

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
