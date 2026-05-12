/**
 * For3s mark — inline SVG so it inherits `currentColor` from the parent
 * (text-brand-bold in Navbar = verde en light, ámbar en dark). Three
 * concentric quarter-pipes form a stylized F. Keep this in sync with
 * /public/logo-mark.svg.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={className}
    >
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M 60 12 L 26 12 A 8 8 0 0 0 18 20 L 18 60" />
        <path d="M 60 24 L 34 24 A 8 8 0 0 0 26 32 L 26 60" />
        <path d="M 60 36 L 42 36 A 8 8 0 0 0 34 44 L 34 60" />
      </g>
    </svg>
  );
}
