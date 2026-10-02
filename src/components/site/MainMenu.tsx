'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { MenuSection } from '@/lib/site';

type Props = { sections: MenuSection[]; labels: { menu: string } };

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
    <nav ref={navRef} aria-label="Main">
      <button
        type="button"
        className="button-quiet md:hidden"
        aria-expanded={mobileOpen}
        aria-controls={`${baseId}-menu`}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {labels.menu}
      </button>
      {/* On phones the panel spans the header (whose container is position: relative). */}
      <ul
        id={`${baseId}-menu`}
        className={`${mobileOpen ? 'block' : 'hidden'} absolute inset-x-0 top-full z-40 border-y border-line bg-header px-gutter py-2 md:static md:flex md:gap-6 md:border-0 md:p-0`}
      >
        {sections.map((section, index) => {
          const isOpen = open === index;
          const containsCurrent = section.links.some((link) => link.current);
          return (
            <li key={section.label} className="relative">
              <button
                type="button"
                className="w-full py-2 text-left font-heading font-semibold tracking-wide md:w-auto"
                aria-expanded={isOpen}
                aria-controls={`${baseId}-${index}`}
                aria-current={containsCurrent ? 'true' : undefined}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                {section.label}
              </button>
              <ul
                id={`${baseId}-${index}`}
                hidden={!isOpen}
                className="z-40 bg-header pb-2 pl-4 md:absolute md:left-0 md:top-full md:min-w-52 md:border md:border-line md:p-2"
              >
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="block py-1 no-underline hover:underline"
                        aria-current={link.current ? 'page' : undefined}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="block py-1 no-underline hover:underline">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
