/** A plain line drawing of a candle. Lit means a flame outline above the wick. No animation. */
export function CandleIcon({ lit, className = '' }: { lit: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 44"
      width="18"
      height="33"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      {lit && <path d="M12 3.5c2.6 3.3 3.4 5.5 3.4 7.3a3.4 3.4 0 0 1-6.8 0c0-1.8.8-4 3.4-7.3Z" />}
      <path d="M12 14.5v4" />
      <rect x="7" y="18.5" width="10" height="24" />
    </svg>
  );
}
