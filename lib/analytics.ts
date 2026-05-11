/**
 * Type-safe analytics events for For3s.
 *
 * Every custom event flows through `track()` so we have a single audit point
 * for what we collect. When you add a new event, add it to the union below
 * and to lib/data.ts if it carries structural meaning the rest of the app
 * needs to know about (e.g. project IDs).
 */

import Clarity from "@microsoft/clarity";

export type AnalyticsEvent =
  // CTA primary — opens the "circle" lead capture modal
  | "connect_modal_opened"
  // Email submitted successfully (stub today, real backend later)
  | "connect_email_submitted"
  // Bilingual surface
  | "language_switched_to_en"
  | "language_switched_to_es"
  // Theme toggle — proxy for B2B (light) vs B2C (dark) audience signal
  | "theme_switched_to_light"
  | "theme_switched_to_dark"
  // Docs engagement
  | "docs_tab_clicked"
  | "docs_item_clicked"
  | "docs_search_used"
  // Navbar nav links — path discovery
  | "nav_link_clicked";

type TagValue = string | string[];
type EventTags = Record<string, TagValue>;

/**
 * Fire a custom Clarity event. Optionally attach tags via setTag — those tags
 * become filterable dimensions in the Clarity dashboard.
 *
 * Guarded against SSR and against Clarity not being initialized yet (e.g.
 * before consent is decided, in which case the event still fires but won't
 * be tied to a persistent visitor cookie).
 */
export function track(event: AnalyticsEvent, tags?: EventTags) {
  if (typeof window === "undefined") return;
  try {
    if (tags) {
      for (const [key, value] of Object.entries(tags)) {
        Clarity.setTag(key, value);
      }
    }
    Clarity.event(event);
  } catch {
    // Clarity not loaded (offline, ad blocker, etc.). Fail silent.
  }
}
