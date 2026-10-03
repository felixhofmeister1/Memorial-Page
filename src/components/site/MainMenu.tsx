'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { MenuSection } from '@/lib/site';

type Props = { sections: MenuSection[]; labels: { menu: string } };

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 10 6"
      width="9"
      height="6"
      aria-hidden="true"
      className={`ml-1.5 inline-block transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Disclosure navigation: each top-level item is a button that opens its sub-menu.
 * Works with keyboard and touch; Escape closes. On phones the whole menu folds away.
 */
export function MainMenu({ sections, labels }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const baseId = useId();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null);
    }
    function onClick(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <nav ref={navRef} aria-label={labels.menu}>
      <button
        type="button"
        className="button-quiet px-3.5 py-2 text-[0.8125rem] uppercase tracking-[0.14em] md:hidden"
        aria-expanded={mobileOpen}
        aria-controls={`${baseId}-menu`}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {labels.menu}
        <Caret open={mobileOpen} />
      </button>
      {/* On phones the panel spans the header (whose container is position: relative). */}
      <ul
        id={`${baseId}-menu`}
        className={`${mobileOpen ? 'block' : 'hidden'} absolute inset-x-0 top-full z-40 border-b border-line bg-header px-gutter pb-4 pt-1 md:static md:flex md:gap-8 md:border-0 md:p-0`}
      >
        {sections.map((section, index) => {
          const isOpen = open === index;
          const containsCurrent = section.links.some((link) => link.current);
          return (
            <li key={section.label} className="relative border-b border-line/70 last:border-0 md:border-0">
              <button
                type="button"
                className={`flex w-full items-center justify-between py-3 text-left text-[0.8125rem] font-semibold uppercase tracking-[0.16em] md:w-auto md:py-1.5 ${
                  containsCurrent ? 'text-accent' : 'text-ink hover:text-accent'
                }`}
                aria-expanded={isOpen}
                aria-controls={`${baseId}-${index}`}
                aria-current={containsCurrent ? 'true' : undefined}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                {section.label}
                <Caret open={isOpen} />
              </button>
              <ul
                id={`${baseId}-${index}`}
                hidden={!isOpen}
                className="z-40 pb-3 md:absolute md:right-0 md:top-full md:mt-3 md:min-w-56 md:border md:border-line md:bg-header md:py-2 md:pb-2"
              >
                {section.links.map((link) => {
                  const className = `block border-l-2 py-1.5 pl-3 pr-4 text-[0.9375rem] no-underline md:py-2 md:pl-4 ${
                    link.current
                      ? 'border-accent font-semibold text-ink'
                      : 'border-transparent text-ink hover:border-line hover:bg-paper-deep'
                  }`;
                  return (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link href={link.href} className={className} aria-current={link.current ? 'page' : undefined}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={className}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
