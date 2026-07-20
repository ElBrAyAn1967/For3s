"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Apartado "Chat" — la conversación real del usuario con el agente For3s general
 * (Pieza B, 2026-07-20). Es el "usarlo" de la demo: el usuario escribe, el agente
 * responde por /api/demo/general/chat (su hilo aislado, identidad = su correo).
 *
 * El historial vive en memoria de la sesión de UI (el hilo real y su memoria los
 * guarda el agente; al volver, el usuario retoma su hilo del lado servidor).
 */
interface Turn {
  role: "user" | "agent";
  text: string;
}

export default function ChatPanel() {
  const t = useTranslations("Demo.shell.chat");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Al llegar un turno nuevo, bajar el scroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, sending]);

  async function enviar() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setError("");
    setTurns((prev) => [...prev, { role: "user", text: message }]);
    setSending(true);
    try {
      const res = await fetch("/api/demo/general/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? t("error"));
        return;
      }
      setTurns((prev) => [...prev, { role: "agent", text: data.reply ?? "" }]);
    } catch {
      setError(t("error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground-active mb-1">
        {t("title")}
      </h2>
      <p className="text-sm text-foreground-secondary mb-5">{t("subtitle")}</p>

      {/* Historial */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-[280px] overflow-y-auto rounded-xl border border-edge-secondary bg-surface-overlay-large p-4 space-y-4"
      >
        {turns.length === 0 && !sending && (
          <p className="text-sm text-foreground-tertiary text-center pt-16">
            {t("empty")}
          </p>
        )}
        {turns.map((turn, i) => (
          <div
            key={i}
            className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                turn.role === "user"
                  ? "bg-brand-bold/10 text-foreground-active"
                  : "bg-surface-primary border border-edge-secondary text-foreground-secondary"
              }`}
            >
              {turn.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-edge-secondary bg-surface-primary px-4 py-2.5 text-sm text-foreground-tertiary">
              {t("thinking")}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      {/* Caja de mensaje */}
      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={1}
          placeholder={t("placeholder")}
          disabled={sending}
          className="flex-1 resize-none rounded-xl border border-edge-primary bg-surface-primary px-4 py-3 text-sm text-foreground-active outline-none transition-colors focus:border-brand-bold disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={sending || !input.trim()}
          aria-label={t("send")}
          className="flex-shrink-0 rounded-xl bg-brand-bold px-4 py-3 text-surface-primary transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SendHorizontal className="size-4" />
        </button>
      </div>
    </div>
  );
}
