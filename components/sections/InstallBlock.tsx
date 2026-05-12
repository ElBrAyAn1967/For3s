"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * InstallBlock — terminal-style command surface for B2C/dark mode.
 * Patrón Modal/Vercel: prefijo $, comando en font-mono, botón copy con feedback.
 * Solo aparece en dark mode (mount es responsabilidad del padre vía `hidden dark:flex`).
 */
export default function InstallBlock() {
  const t = useTranslations("Hero.install");
  const [copied, setCopied] = useState(false);
  const command = t("command");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      track("hero_install_copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail on insecure contexts; silently noop.
    }
  }

  return (
    <div className="inline-flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full bg-surface-overlay-large border border-edge-primary font-mono text-sm text-foreground-secondary max-w-full">
      <span className="text-brand-bold/70 shrink-0" aria-hidden>
        $
      </span>
      <code className="text-foreground-active truncate min-w-0">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? t("copied") : t("copy")}
        className="size-8 inline-flex items-center justify-center rounded-full bg-surface-overlay-small hover:bg-brand-bold/15 text-foreground-secondary hover:text-brand-bold transition-colors shrink-0"
      >
        {copied ? (
          <Check className="size-3.5 text-brand-bold" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  );
}
