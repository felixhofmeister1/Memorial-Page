/**
 * A quiet line drawing of a candle. When lit, a small amber flame stands above the wick.
 * `appear` lets the flame rise gently once (for the moment someone lights it);
 * visitors who prefer reduced motion see it at once.
 */
export function CandleIcon({
  lit,
  appear = false,
  size = 'large',
  className = '',
}: {
  lit: boolean;
  appear?: boolean;
  size?: 'large' | 'small';
  className?: string;
}) {
  const [w, h] = size === 'large' ? [34, 62] : [14, 26];
  return (
    <svg viewBox="0 0 40 72" width={w} height={h} fill="none" aria-hidden="true" className={className}>
      {lit && (
        <g className={appear ? 'flame-appear' : undefined}>
          <path
            d="M20 3c5.2 6.6 7.4 11.3 7.4 15.2A7.4 7.4 0 0 1 20 25.6a7.4 7.4 0 0 1-7.4-7.4C12.6 14.3 14.8 9.6 20 3Z"
            fill="var(--color-flame)"
          />
          <path d="M20 12.5c2.2 2.9 3.1 4.9 3.1 6.6a3.1 3.1 0 0 1-6.2 0c0-1.7.9-3.7 3.1-6.6Z" fill="#f3d9a4" />
        </g>
      )}
      <path d="M20 24.5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 32.5c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2V70H12V32.5Z"
        fill="var(--color-field)"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M22.5 30.5v6.5a1.6 1.6 0 0 0 3.2 0v-6.5" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <path d="M6 70.5h28" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
