"use client";

import { useState } from "react";
import { waitlistPublica } from "@/lib/for3sAdmin";

/**
 * Formulario público de lista de espera de For3s OS. Postea DIRECTO al canal
 * público (Funnel) — sin backend en Vercel, sin secretos. El server valida,
 * dedupe por email y rate-limita; aquí solo UX honesta de los 3 resultados.
 */
export default function WaitlistFor3s() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [detalle, setDetalle] = useState("");

  const enviar = async () => {
    if (!nombre.trim() || !email.trim()) {
      setEstado("error");
      setDetalle("Nombre y email son obligatorios.");
      return;
    }
    setEstado("enviando");
    setDetalle("");
    const r = await waitlistPublica({
      nombre: nombre.trim(),
      email: email.trim(),
      mensaje: mensaje.trim() || undefined,
    });
    if (r.ok) {
      setEstado("ok");
    } else {
      setEstado("error");
      setDetalle(
        r.error === "demasiadas solicitudes"
          ? "Demasiados intentos por ahora — vuelve en un rato."
          : r.error === "request inválido"
            ? "Revisa el email (formato) y el nombre."
            : "No pudimos registrarte en este momento. Intenta más tarde.",
      );
    }
  };

  if (estado === "ok") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
        <div className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-8 text-center">
          <p className="text-3xl mb-3">✓</p>
          <h1 className="text-xl font-semibold text-foreground-active mb-2">Estás en la lista</h1>
          <p className="text-sm text-foreground-secondary">
            Te contactamos en cuanto abramos el siguiente cupo de la API de For3s OS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-8">
        <p className="text-[11px] font-mono uppercase tracking-widest text-brand-bold mb-2">
          For3s OS · API
        </p>
        <h1 className="text-xl font-semibold text-foreground-active mb-2">Lista de espera</h1>
        <p className="text-sm text-foreground-secondary mb-6">
          Memoria como infraestructura: tu producto conversa, For3s recuerda. Deja tus
          datos y te abrimos acceso a la API.
        </p>
        <div className="space-y-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre / empresa"
            className="w-full rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-4 py-3 text-sm text-foreground-active outline-none transition-colors"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-4 py-3 text-sm text-foreground-active outline-none transition-colors"
          />
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="¿Qué quieres construir? (opcional)"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg bg-surface-primary border border-edge-primary focus:border-brand-bold px-4 py-3 text-sm text-foreground-active outline-none transition-colors resize-none"
          />
        </div>
        {estado === "error" && <p className="mt-3 text-xs text-danger">{detalle}</p>}
        <button
          type="button"
          onClick={enviar}
          disabled={estado === "enviando"}
          className="btn-pill btn-pill-primary w-full mt-5"
        >
          {estado === "enviando" ? "Enviando…" : "Pedir acceso"}
        </button>
        <p className="text-[11px] text-foreground-tertiary mt-4">
          Solo usamos estos datos para contactarte por el acceso. Nada de spam.
        </p>
      </div>
    </div>
  );
}
