"use client";

import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import GeneralExperience from "./GeneralExperience";
import type { DemoKind } from "@/lib/demo/types";

/**
 * Cliente que envuelve una demo (General o 1:1). Hay UN SOLO <GeneralExperience>
 * en una posición fija del árbol (nunca se remonta → no pierde su estado).
 *
 * `inShell` (= usuario con cupo activo) solo controla qué se muestra ALREDEDOR:
 *   - false: navbar + encabezado de marketing + footer del sitio.
 *   - true:  nada del sitio; la app del demo ocupa toda la pantalla.
 */
export default function GeneralPageShell({
  kind = "general",
  label,
  title,
  description,
}: {
  kind?: DemoKind;
  label: string;
  title: string;
  description: string;
}) {
  const [inShell, setInShell] = useState(false);

  return (
    <>
      {!inShell && <Navbar />}
      <main
        className={
          inShell
            ? "min-h-svh flex items-start md:items-center justify-center px-3 py-4 sm:px-4 sm:py-8 bg-surface-primary"
            : "flex-1 min-h-[calc(100svh-4rem)] flex items-center pt-16"
        }
      >
        <div
          className={
            inShell
              ? "w-full flex justify-center"
              : "max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24 w-full text-center"
          }
        >
          {!inShell && (
            <>
              <p className="text-[10px] sm:text-xs font-mono font-semibold tracking-[0.18em] uppercase text-foreground-accent mb-4">
                {label}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.1] tracking-tight text-foreground-active mb-5">
                {title}
              </h1>
              <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed max-w-xl mx-auto mb-10">
                {description}
              </p>
            </>
          )}

          {/* Único GeneralExperience con key fija — React nunca lo remonta,
              así que su estado de sesión sobrevive al cambio de inShell. */}
          <div className={inShell ? "w-full" : "flex justify-center"}>
            <GeneralExperience
              key="demo-experience"
              kind={kind}
              onActiveChange={setInShell}
            />
          </div>
        </div>
      </main>
      {!inShell && <Footer />}
    </>
  );
}
