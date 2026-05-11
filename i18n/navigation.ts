import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Canonical next-intl navigation API. We currently consume `useRouter` and
// `usePathname`; the rest (`Link`, `redirect`, `getPathname`) are re-exported
// so any future component can grab them from the same module without
// re-wiring next-intl in two places.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
