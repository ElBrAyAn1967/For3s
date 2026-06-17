"use client";

import { useCallback, useEffect, useState } from "react";
import type { DemoUser } from "@/lib/demo/types";

/**
 * Dashboard admin de la demo General. Login por contraseña (patrón godinez:
 * el password se guarda en memoria y se manda como header X-Admin-Password).
 * Muestra: conteos + tabla de personas (nombre, correo, estado, fecha).
 *
 * Página sin i18n a propósito: es interna, solo para Brian.
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

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);

  const login = useCallback(async () => {
    const res = await fetch("/api/demo/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  }, [password]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/demo/admin/users", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const data = (await res.json()) as { users: DemoUser[]; counts: Counts };
      setUsers(data.users);
      setCounts(data.counts);
    }
  }, [password]);

  // Auto-refresca la tabla cada 5s mientras esté autenticado.
  useEffect(() => {
    if (!authed) return;
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [authed, refresh]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
        <div className="w-full max-w-sm rounded-2xl border border-edge-primary bg-surface-overlay-large p-8">
          <h1 className="text-xl font-semibold text-foreground-active mb-2">
            For3s · Demo Admin
          </h1>
          <p className="text-sm text-foreground-secondary mb-5">
            Acceso restringido.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (authError) setAuthError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Contraseña"
            className={`w-full rounded-lg bg-surface-primary border px-4 py-3 text-sm text-foreground-active outline-none transition-colors ${
              authError ? "border-danger" : "border-edge-primary focus:border-brand-bold"
            }`}
          />
          {authError && (
            <p className="mt-2 text-xs text-danger">Contraseña incorrecta.</p>
          )}
          <button
            type="button"
            onClick={login}
            className="btn-pill btn-pill-primary w-full mt-4"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary px-4 py-10 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground-active mb-1">
          Demo General · Personas
        </h1>
        <p className="text-sm text-foreground-secondary mb-6">
          Registros y lista de espera. Se actualiza cada 5 s.
        </p>

        {counts && (
          <div className="grid grid-cols-3 gap-3 mb-8">
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
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-foreground-tertiary"
                  >
                    Sin registros todavía.
                  </td>
                </tr>
              )}
              {users.map((u) => (
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