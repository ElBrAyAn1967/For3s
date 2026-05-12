/**
 * Source of truth for FAQ entry keys. Lives in /lib (not in a "use client"
 * component) so it can be imported from server components (FAQPage JSON-LD
 * generation) without breaking server/client boundary serialization.
 */
export const FAQ_ITEM_KEYS = [
  "que-es-for3s",
  "para-quien",
  "open-source",
  "diferencia-latam",
  "estado-actual",
  "como-empezar",
] as const;
