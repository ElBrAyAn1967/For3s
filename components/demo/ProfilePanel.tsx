"use client";

import { useRef, useState } from "react";
import {
  User,
  Mail,
  KeyRound,
  BadgeCheck,
  Settings,
  Power,
  Lock,
  Camera,
  Check,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { DemoKind } from "@/lib/demo/types";

const photoKey = (email: string) => `for3s_demo_photo_${email}`;

/**
 * Vista de Perfil — datos tipo Claude/ChatGPT, editable.
 *
 * - Engrane (junto al badge) → modo edición: nombre, API key (→ BD) y foto
 *   (→ solo localStorage del navegador).
 * - Toggle del agente (encender/apagar el contenedor Docker de For3s OS):
 *   SOLO jazz/mashe/brian. General ve una leyenda "solo para usuarios de pago".
 */
export default function ProfilePanel({
  kind,
  name: initialName,
  email,
  keyHint: initialHint,
  agentOn: initialAgentOn,
}: {
  kind: DemoKind;
  name: string;
  email: string;
  keyHint: string | null;
  agentOn: boolean;
}) {
  const t = useTranslations("Demo.shell.profile");
  const isPaid = kind === "jazz" || kind === "mashe" || kind === "brian";

  const [name, setName] = useState(initialName);
  const [keyHint, setKeyHint] = useState(initialHint);
  const [agentOn, setAgentOn] = useState(initialAgentOn);
  const [photo, setPhoto] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(photoKey(email));
    } catch {
      return null;
    }
  });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(initialName);
  const [editKey, setEditKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyAgent, setBusyAgent] = useState(false);
  const [showPaidNote, setShowPaidNote] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      setPhoto(data);
      try {
        window.localStorage.setItem(photoKey(email), data);
      } catch {
        // localStorage lleno / no disponible
      }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/demo/general/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        ...(editKey.trim() ? { apiKey: editKey.trim() } : {}),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = (await res.json()) as { hint: string | null };
      setName(editName.trim().toLowerCase().replace(/\s+/g, " "));
      if (data.hint) setKeyHint(data.hint);
      setEditKey("");
      setEditing(false);
    }
  };

  const toggleAgent = async () => {
    if (!isPaid) {
      setShowPaidNote(true);
      return;
    }
    setBusyAgent(true);
    const next = !agentOn;
    const res = await fetch("/api/demo/general/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on: next }),
    });
    setBusyAgent(false);
    if (res.ok) setAgentOn(next);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-foreground-active">
          {t("title")}
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditName(name);
              setEditing(true);
            }}
            aria-label={t("edit")}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-edge-primary text-foreground-secondary hover:text-foreground-active hover:bg-surface-primary-hover transition-colors"
          >
            <Settings className="size-4" />
          </button>
        )}
      </div>
      <p className="text-sm text-foreground-secondary mb-6">{t("subtitle")}</p>

      {/* Cabecera de perfil con avatar (foto o inicial) */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-edge-primary bg-surface-overlay-large p-4 sm:p-5 mb-4">
        <div className="relative flex-shrink-0">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={name}
              className="size-14 rounded-full object-cover border border-edge-primary"
            />
          ) : (
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand-bold/15 border border-brand-bold/30 text-xl font-semibold text-foreground-accent uppercase">
              {(name || "?").charAt(0)}
            </span>
          )}
          {editing && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={t("changePhoto")}
              className="absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full bg-brand-bold text-primary-foreground border-2 border-surface-overlay-large"
            >
              <Camera className="size-3" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickPhoto}
            className="hidden"
          />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t("name")}
              className="w-full rounded-lg bg-surface-primary border border-edge-primary px-3 py-2 text-sm text-foreground-active outline-none focus:border-brand-bold"
            />
          ) : (
            <p className="text-base font-semibold text-foreground-active capitalize truncate">
              {name || "—"}
            </p>
          )}
          <p className="text-sm text-foreground-secondary truncate mt-0.5">
            {email}
          </p>
        </div>

        {/* Estado del agente: toggle (1:1) o badge conectado (general) */}
        {!editing && (
          <div className="flex flex-col items-start sm:items-end gap-1 w-full sm:w-auto sm:ml-auto">
            {isPaid ? (
              <button
                type="button"
                onClick={toggleAgent}
                disabled={busyAgent}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-widest transition-colors disabled:opacity-60 ${
                  agentOn
                    ? "border-brand-bold/30 bg-brand-bold/10 text-foreground-accent"
                    : "border-edge-primary bg-surface-primary text-foreground-tertiary"
                }`}
              >
                <Power className="size-3.5" />
                {agentOn ? t("agentOn") : t("agentOff")}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPaidNote(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-bold/30 bg-brand-bold/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-foreground-accent"
                >
                  <BadgeCheck className="size-3.5" />
                  {t("connected")}
                </button>
                {showPaidNote && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-foreground-tertiary">
                    <Lock className="size-3" />
                    {t("paidOnly")}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Detalle / edición de API key */}
      <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large divide-y divide-edge-secondary">
        <Row Icon={User} label={t("name")} value={name || "—"} />
        <Row Icon={Mail} label={t("email")} value={email} />
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
          <KeyRound className="size-4 text-foreground-tertiary flex-shrink-0" />
          <span className="text-sm text-foreground-secondary w-20 sm:w-32 flex-shrink-0">
            {t("apiKey")}
          </span>
          {editing ? (
            <input
              type="password"
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              placeholder={keyHint ? `Claude · ${keyHint}` : "sk-ant-…"}
              className="flex-1 rounded-lg bg-surface-primary border border-edge-primary px-3 py-2 text-sm font-mono text-foreground-active outline-none focus:border-brand-bold"
            />
          ) : (
            <span className="text-sm text-foreground-active truncate">
              {keyHint ? `Claude · ${keyHint}` : t("noKey")}
            </span>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !editName.trim()}
            className="btn-pill btn-pill-primary disabled:opacity-60"
          >
            <Check className="size-4 mr-1.5" />
            {saving ? t("saving") : t("save")}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setEditKey("");
            }}
            className="btn-pill btn-pill-secondary"
          >
            <X className="size-4 mr-1.5" />
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({
  Icon,
  label,
  value,
}: {
  Icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
      <Icon className="size-4 text-foreground-tertiary flex-shrink-0" />
      <span className="text-sm text-foreground-secondary w-20 sm:w-32 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground-active truncate capitalize">
        {value}
      </span>
    </div>
  );
}
