// Flat illustration for the Overview hero: a phone, a circuit board and a
// screwdriver on a blueprint grid. Decorative only, so hidden from screen readers.
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 400" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="hero-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="var(--color-illustration-line)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="480" height="400" fill="var(--color-illustration)" />
      <rect width="480" height="400" fill="url(#hero-grid)" />
      {/* tablet back */}
      <rect x="60" y="190" width="120" height="170" rx="12" fill="var(--color-device-light)" />
      <rect x="72" y="204" width="96" height="14" rx="4" fill="var(--color-illustration-line)" />
      {/* circuit board */}
      <rect x="200" y="110" width="64" height="150" rx="6" fill="var(--color-board)" />
      <rect x="212" y="126" width="22" height="22" rx="3" fill="var(--color-text)" />
      <rect x="240" y="126" width="14" height="10" rx="2" fill="var(--color-illustration-line)" />
      <rect x="212" y="160" width="40" height="28" rx="3" fill="var(--color-text)" />
      <rect x="212" y="204" width="14" height="14" rx="2" fill="var(--color-device-light)" />
      {/* phone */}
      <rect x="290" y="40" width="150" height="300" rx="24" fill="var(--color-device)" />
      <rect x="306" y="58" width="36" height="36" rx="10" fill="var(--color-text)" />
      <circle cx="324" cy="76" r="9" fill="var(--color-device)" />
      <circle cx="365" cy="215" r="52" fill="var(--color-text)" />
      <circle cx="365" cy="215" r="34" fill="var(--color-device)" />
      {/* screwdriver */}
      <path d="M420 230 L350 380" stroke="var(--color-device-light)" strokeWidth="10" strokeLinecap="round" />
      {/* loose screws */}
      <circle cx="170" cy="150" r="5" fill="var(--color-surface)" />
      <circle cx="190" cy="82" r="5" fill="var(--color-surface)" />
    </svg>
  );
}
