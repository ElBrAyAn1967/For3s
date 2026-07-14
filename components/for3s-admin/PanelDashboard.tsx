"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PanelError,
  clearToken,
  getToken,
  setToken,
  validarToken,
} from "@/lib/for3sAdmin";
import SeccionResumen from "./SeccionResumen";
import SeccionClientes from "./SeccionClientes";
import SeccionWaitlist from "./SeccionWaitlist";
import SeccionInstancias from "./SeccionInstancias";

/**
 * Panel de administración de For3s OS (Frente B F4.c). Página interna, solo
 * Brian, sin i18n a propósito (patrón demo-admin). El navegador habla DIRECTO
 * con el server por el tailnet — Vercel no ve token ni datos: sin Tailscale +
 * token esta página es un cascarón vacío.
 */

type Tab = "resumen" | "clientes" | "waitlist" | "instancias";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "clientes", label: "Clientes" },
  { id: "waitlist", label: "Waitlist" },
  { id: "instancias", label: "Instancias" },
];

export default function PanelDashboard() {
  const [tokenInput, setTokenInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("resumen");
  // el prospecto que se está convirtiendo en cliente (Waitlist → Clientes)
  const [prefillAlta, setPrefillAlta] = useState<{ nombre: string; email: string; waitlistId: number } | null>(null);

  // al montar: si hay token guardado, validarlo (sin pedirlo de nuevo)
  useEffect(() => {
    let alive = true;
    (async () => {
      const guardado = getToken();
      if (!guardado) {
        if (alive) setChecking(false);
        return;
      }
      try {
        const ok = await validarToken(guardado);
        if (alive) setAuthed(ok);
      } catch {
        // red caída ≠ token malo: no borrar el token, solo pedir reintento
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async () => {
    const tok = tokenInput.trim();
    if (!tok) return;
    setLoginError("");
    try {
      const ok = await validarToken(tok);
      if (ok) {
        setToken(tok);
        setAuthed(true);
        setTokenInput("");
      } else {
        setLoginError("Token inválido.");
      }
    } catch (e) {
      setLoginError(
        e instanceof PanelError && e.kind === "red"
          ? "No llego al server. ¿Tailscale está encendido en esta máquina?"
          : "Error inesperado validando el token.",
      );
    }
  }, [tokenInput]);

  const logout = useCallback(() => {
    clearToken();
    setAuthed(false);
    setTab("resumen");
  }, []);

  const convertirProspecto = useCallback(
    (p: { nombre: string; email: string; waitlistId: number }) => {
      setPrefillAlta(p);
      setTab("clientes");
    },
    [],
  );

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <p className="text-sm text-foreground-tertiary font-mono">Conectando…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
        <div className="w-full max-w-sm rounded-2xl border border-edge-primary bg-surface-overlay-large p-8">
          <p className="text-[11px] font-mono uppercase tracking-widest text-brand-bold mb-2">
            For3s OS
          </p>
          <h1 className="text-xl font-semibold text-foreground-active mb-2">
            Panel de administración
          </h1>
          <p className="text-sm text-foreground-secondary mb-5">
            Acceso por tailnet + token. Nada vive en esta página.
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => {
              setTokenInput(e.target.value);
              if (loginError) setLoginError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Token de admin"
            autoComplete="off"
            className={`w-full rounded-lg bg-surface-primary border px-4 py-3 text-sm text-foreground-active outline-none transition-colors ${
              loginError ? "border-danger" : "border-edge-primary focus:border-brand-bold"
            }`}
          />
          {loginError && <p className="mt-2 text-xs text-danger">{loginError}</p>}
          <button type="button" onClick={login} className="btn-pill btn-pill-primary w-full mt-4">
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary px-4 py-8 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-brand-bold mb-1">
              For3s OS · plano admin (tailnet)
            </p>
            <h1 className="text-2xl font-semibold text-foreground-active">
              Panel de administración
            </h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-mono text-foreground-tertiary hover:text-foreground-active transition-colors border border-edge-primary rounded-full px-4 py-2"
          >
            Salir (borra el token)
          </button>
        </div>

        <div className="flex gap-2 mb-8 border-b border-edge-secondary">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-brand-bold text-foreground-active font-medium"
                  : "border-transparent text-foreground-tertiary hover:text-foreground-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resumen" && <SeccionResumen />}
        {tab === "clientes" && (
          <SeccionClientes
            prefillAlta={prefillAlta}
            onAltaConsumida={() => setPrefillAlta(null)}
          />
        )}
        {tab === "waitlist" && <SeccionWaitlist onConvertir={convertirProspecto} />}
        {tab === "instancias" && <SeccionInstancias />}
      </div>
    </div>
  );
}
