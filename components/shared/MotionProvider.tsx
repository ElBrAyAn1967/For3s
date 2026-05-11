"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * LazyMotion wrapper — defers full framer-motion bundle and lets us use
 * the lighter `m.*` components instead of `motion.*` across the app.
 * Saves ~30 KB from the initial JS bundle (react-doctor `use-lazy-motion`).
 *
 * `domAnimation` enables: animations, exit animations, variants, hover, tap,
 * focus, drag, layout (not pan/keyboard gestures). Covers our usage.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
