import { ImageResponse } from "next/og";

/**
 * Shared OG image renderer. 1200x630 (LinkedIn/Twitter/Open Graph spec).
 *
 * Style: cream canvas with subtle 48px grid pattern (echo del hero),
 * pill overline en verde institucional, headline grande, footer con
 * dominio. Brand mark sits top-right.
 *
 * We use a single light variant for OG because Twitter/LinkedIn previews
 * don't honor user theme; cream + verde reads better than obsidiana + ámbar
 * in feeds where the surrounding chrome is white.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const COLORS = {
  canvas: "#fff9ef",
  ink: "#181818",
  inkSoft: "#5c5a55",
  accent: "#225a32",
  accentSoft: "rgba(34, 90, 50, 0.08)",
  grid: "rgba(34, 90, 50, 0.05)",
  divider: "rgba(0, 0, 0, 0.08)",
};

type RenderProps = {
  /** Pre-headline kicker. ALL CAPS. */
  overline?: string;
  /** Main headline. Usually the page or doc title. */
  title: string;
  /** Optional supporting line under the title. */
  subtitle?: string;
};

export function renderOg({ overline, title, subtitle }: RenderProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: COLORS.canvas,
          color: COLORS.ink,
          fontFamily: "Inter, sans-serif",
          backgroundImage: `
            linear-gradient(${COLORS.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      >
        {/* Top row: brand mark left, domain right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Inline SVG of the For3s mark — same paths as logo-mark.svg */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g
                stroke={COLORS.accent}
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              >
                <path d="M 60 12 L 26 12 A 8 8 0 0 0 18 20 L 18 60" />
                <path d="M 60 24 L 34 24 A 8 8 0 0 0 26 32 L 26 60" />
                <path d="M 60 36 L 42 36 A 8 8 0 0 0 34 44 L 34 60" />
              </g>
            </svg>
            <span
              style={{
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: COLORS.accent,
              }}
            >
              For3s
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              color: COLORS.inkSoft,
              fontFamily: "monospace",
              letterSpacing: "0.06em",
            }}
          >
            for3s.ai
          </span>
        </div>

        {/* Center: overline + headline + optional subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {overline ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "8px 16px",
                borderRadius: 999,
                background: COLORS.accentSoft,
                color: COLORS.accent,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            >
              {overline}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: COLORS.ink,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: COLORS.inkSoft,
                maxWidth: 900,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Bottom: divider + tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: `1px solid ${COLORS.divider}`,
            fontSize: 18,
            color: COLORS.inkSoft,
          }}
        >
          <span>Infraestructura para agentes · LATAM</span>
          <span style={{ fontFamily: "monospace", color: COLORS.accent }}>
            ─ ─ ─
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
