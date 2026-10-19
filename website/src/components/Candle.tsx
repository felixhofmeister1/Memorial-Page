/**
 * A plain drawn candle: cream wax, a dark wick, and when lit a small flame.
 * The large one (on a memorial page) moves very slightly, unless the visitor prefers less motion.
 */
export function Candle({ lit, size = 'small', class: className = '' }: { lit: boolean; size?: 'small' | 'large'; class?: string }) {
  if (size === 'small') {
    return (
      <svg viewBox="0 0 16 24" width="12" height="18" aria-hidden="true" class={`candle-icon ${className}`}>
        {lit && <path d="M8 1.2c1.9 2.5 2.7 4.2 2.7 5.6a2.7 2.7 0 0 1-5.4 0c0-1.4.8-3.1 2.7-5.6Z" fill="var(--flame)" />}
        <path d="M8 10.2v2.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        <rect x="4.6" y="12.6" width="6.8" height="10.4" rx="0.8" fill="var(--wax)" stroke="currentColor" stroke-width="1.1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 150" width="64" height="120" aria-hidden="true" class={`candle-large ${lit ? 'is-lit' : ''} ${className}`}>
      <ellipse class="candle-glow" cx="40" cy="34" rx="30" ry="34" fill="url(#candle-glow)" />
      <defs>
        <radialGradient id="candle-glow">
          <stop offset="0" stop-color="var(--flame)" stop-opacity="0.22" />
          <stop offset="1" stop-color="var(--flame)" stop-opacity="0" />
        </radialGradient>
      </defs>
      <g class="candle-flame">
        <path d="M40 10c6.4 8.2 9.2 13.8 9.2 18.6a9.2 9.2 0 0 1-18.4 0C30.8 23.8 33.6 18.2 40 10Z" fill="var(--flame)" />
        <path d="M40 21.5c2.7 3.4 3.8 5.8 3.8 7.8a3.8 3.8 0 0 1-7.6 0c0-2 1.1-4.4 3.8-7.8Z" fill="var(--flame-core)" />
      </g>
      <path d="M40 38v8" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
      <path d="M27 50.5c0-1.4 1.1-2.5 2.5-2.5h21c1.4 0 2.5 1.1 2.5 2.5V140H27V50.5Z" fill="var(--wax)" stroke="var(--ink)" stroke-width="2" />
      <path d="M33 56v70" stroke="var(--wax-shade)" stroke-width="3" stroke-linecap="round" />
      <path d="M17 141h46" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" />
    </svg>
  );
}
