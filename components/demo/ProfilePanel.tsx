"use client";

import { User, Mail, KeyRound, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Vista de Perfil — datos tipo Claude/ChatGPT. En esta fase muestra lo que ya
 * tenemos de la sesión (nombre, correo) + estado de la API key conectada.
 * `name`/`email` vienen de la sesión; `keyHint` del gate de API key.
 */
export default function ProfilePanel({
  name,
  email,
  keyHint,
}: {
  name: string;
  email: string;
  keyHint: string | null;
}) {
  const t = useTranslations("Demo.shell.profile");

  const rows = [
    { Icon: User, label: t("name"), value: name || "—" },
    { Icon: Mail, label: t("email"), value: email || "—" },
    {
      Icon: KeyRound,
      label: t("apiKey"),
      value: keyHint ? `Claude · ${keyHint}` : t("noKey"),
    },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground-active mb-1">
        {t("title")}
      </h2>
      <p className="text-sm text-foreground-secondary mb-6">{t("subtitle")}</p>

      {/* Cabecera de perfil con avatar (inicial) */}
      <div className="flex items-center gap-4 rounded-2xl border border-edge-primary bg-surface-overlay-large p-5 mb-4">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand-bold/15 border border-brand-bold/30 text-xl font-semibold text-foreground-accent uppercase">
          {(name || "?").charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground-active capitalize truncate">
            {name || "—"}
          </p>
          <p className="text-sm text-foreground-secondary truncate">{email}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-brand-bold/30 bg-brand-bold/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-foreground-accent">
          <BadgeCheck className="size-3.5" />
          {t("connected")}
        </span>
      </div>

      {/* Detalle */}
      <div className="rounded-2xl border border-edge-primary bg-surface-overlay-large divide-y divide-edge-secondary">
        {rows.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4">
            <Icon className="size-4 text-foreground-tertiary flex-shrink-0" />
            <span className="text-sm text-foreground-secondary w-32 flex-shrink-0">
              {label}
            </span>
            <span className="text-sm text-foreground-active truncate">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}