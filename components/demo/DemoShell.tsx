"use client";

import { useState } from "react";
import { MessageSquare, User, Plug, KeyRound, Brain, LogOut, PanelsTopLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import ConnectApiKey from "./ConnectApiKey";
import ChatPanel from "./ChatPanel";
import ProfilePanel from "./ProfilePanel";
import ConnectorsPanel from "./ConnectorsPanel";
import ApiKeysPanel from "./ApiKeysPanel";
import BrainPanel from "./BrainPanel";
import type { DemoKind } from "@/lib/demo/types";

/**
 * Shell de la app del demo, para usuarios YA registrados y con cupo activo.
 *
 * - GATE: primero pide la API key de Claude (igual que en los generales). Sin
 *   key no se puede usar el shell.
 * - Una vez con key: layout con sidebar izquierdo + topbar propios (el menú del
 *   sitio se oculta a este nivel). Navegación: Perfil / Conectores.
 *
 * Recibe los datos de la sesión (name/email) y el callback de cerrar sesión.
 */
type Section = "chat" | "profile" | "connectors" | "keys" | "brain";

export default function DemoShell({
  kind,
  name,
  email,
  initialKeyHint = null,
  agentOn = true,
  onLogout,
}: {
  kind: DemoKind;
  name: string;
  email: string;
  initialKeyHint?: string | null; // si ya tenía SK guardada, entra directo
  agentOn?: boolean;
  onLogout: () => void;
}) {
  const t = useTranslations("Demo.shell");
  const [keyHint, setKeyHint] = useState<string | null>(initialKeyHint);
  const [section, setSection] = useState<Section>("chat");

  // Mientras no haya API key, el shell se muestra completo (sidebar + topbar)
  // pero el contenido inicial es la PETICIÓN de API key (primera petición dentro
  // de la demo). La navegación Perfil/Conectores queda bloqueada hasta conectarla.
  const connected = !!keyHint;

  const nav: { key: Section; label: string; Icon: typeof User }[] = [
    { key: "chat", label: t("nav.chat"), Icon: MessageSquare },
    { key: "profile", label: t("nav.profile"), Icon: User },
    { key: "connectors", label: t("nav.connectors"), Icon: Plug },
    { key: "keys", label: t("nav.keys"), Icon: KeyRound },
    { key: "brain", label: t("nav.brain"), Icon: Brain },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl border border-edge-primary bg-surface-primary overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
      {/* En móvil: una sola columna (sin sidebar). En md+: sidebar + contenido. */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] min-h-[520px] sm:min-h-[560px]">
        {/* Sidebar izquierdo — solo md+ */}
        <aside className="hidden md:flex border-r border-edge-secondary bg-surface-overlay-large p-4 flex-col">
          <div className="flex items-center gap-2 px-2 py-2 mb-4">
            <PanelsTopLeft className="size-4 text-brand-bold flex-shrink-0" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-foreground-accent">
              For3s
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                disabled={!connected}
                onClick={() => setSection(key)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  connected && section === key
                    ? "bg-brand-bold/10 text-foreground-accent font-medium"
                    : "text-foreground-secondary hover:bg-surface-primary-hover"
                }`}
              >
                <Icon className="size-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Columna derecha: topbar + contenido */}
        <div className="flex flex-col min-w-0">
          {/* Topbar. En móvil (sin sidebar) es la navegación principal con íconos.
              En md+ el sidebar ya navega, así que aquí SOLO queda "Cerrar sesión"
              a la derecha — sin duplicar el menú (Brian 2026-07-22). */}
          <header className="flex flex-wrap items-center justify-between md:justify-end gap-1 border-b border-edge-secondary px-3 py-2.5 sm:px-4 sm:py-3">
            {/* Navegación: solo en móvil (md:hidden) */}
            <div className="flex flex-wrap items-center gap-1 md:hidden">
              {nav.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  disabled={!connected}
                  onClick={() => setSection(key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    connected && section === key
                      ? "text-foreground-accent"
                      : "text-foreground-tertiary hover:text-foreground-active"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            {/* Cerrar sesión: siempre visible (importante, Brian) */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] sm:text-xs font-mono uppercase tracking-widest text-foreground-tertiary hover:text-danger transition-colors"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </button>
          </header>

          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
            {!connected ? (
              // Primera petición dentro de la demo: conectar la API key de Claude.
              <div className="flex justify-center pt-6">
                <ConnectApiKey onConnected={setKeyHint} persist defaultOpen />
              </div>
            ) : section === "chat" ? (
              <ChatPanel />
            ) : section === "profile" ? (
              <ProfilePanel
                kind={kind}
                name={name}
                email={email}
                keyHint={keyHint}
                agentOn={agentOn}
              />
            ) : section === "connectors" ? (
              <ConnectorsPanel />
            ) : section === "keys" ? (
              <ApiKeysPanel />
            ) : (
              <BrainPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}