"use client";

import { useTheme } from "@/lib/useTheme";
import HeroLight from "./HeroLight";
import HeroDark from "./HeroDark";

/**
 * Hero dispatcher — monta el Hero del modo activo. Dos archivos
 * independientes (HeroLight, HeroDark) para que cada audiencia tenga
 * su propio shape sin acumular `dark:` modifiers en un solo árbol.
 *
 * Light: institucional B2B. Dark: builder B2C con install block.
 */
export default function Hero() {
  const theme = useTheme();
  return theme === "dark" ? <HeroDark /> : <HeroLight />;
}
