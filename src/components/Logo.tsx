import Link from "next/link";

/**
 * Dwellspan logo system
 *
 * Symbol: one continuous rounded line draws a roof, two walls, and an open
 * arched doorway. The doorway is negative space: a home you step into.
 * Built on a 32 unit grid with a 2.75 unit stroke, round caps and joins.
 *
 * Lockup: symbol + lowercase wordmark. Gap between them = 0.25 × symbol size.
 * Clear space on every side = the doorway width (7 units at 32).
 * Minimum size: symbol 16px, lockup 96px wide.
 */

export const SYMBOL_PATH = "M7 27V15L16 7.5L25 15V27H19.5V22a3.5 3.5 0 0 0-7 0v5Z";

export function LogoSymbol({ className = "size-8", strokeWidth = 2.75 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path d={SYMBOL_PATH} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-semibold leading-none tracking-[-0.04em] ${className}`}>dwellspan</span>;
}

/** Horizontal lockup. `tone` follows the colour rules: brand on light, white on dark. */
export function LogoLockup({
  tone = "brand",
  size = "md",
}: {
  tone?: "brand" | "ink" | "white";
  size?: "md" | "lg" | "xl";
}) {
  const color = tone === "brand" ? "text-brand" : tone === "ink" ? "text-ink" : "text-paper";
  const s = {
    md: { sym: "size-8", word: "text-[25px]", gap: "gap-2" },
    lg: { sym: "size-12", word: "text-[39px]", gap: "gap-2" },
    xl: { sym: "size-16", word: "text-[48px]", gap: "gap-4" },
  }[size];
  return (
    <span className={`inline-flex items-center ${s.gap} ${color}`}>
      <LogoSymbol className={s.sym} />
      <Wordmark className={s.word} />
    </span>
  );
}

export function Logo({ onClick, dark = false }: { onClick?: () => void; dark?: boolean }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Dwellspan home"
      className={`inline-flex rounded-lg ${dark ? "focus-ring-dark" : "focus-ring"}`}
    >
      <LogoLockup tone={dark ? "white" : "brand"} />
    </Link>
  );
}
