import { useEffect, useState } from 'preact/hooks';

/*
 * Addresses live after the # (…/Memorial-Page/#/m/lupita), so every page works on
 * GitHub Pages, which only serves files, and the browser's back button works as usual.
 */

export type Route =
  | { name: 'home'; query: URLSearchParams }
  | { name: 'new' }
  | { name: 'person'; slug: string }
  | { name: 'edit'; slug: string }
  | { name: 'about' }
  | { name: 'notFound' };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { name: 'home', query: new URLSearchParams(search) };
  if (parts[0] === 'new' && parts.length === 1) return { name: 'new' };
  if (parts[0] === 'about' && parts.length === 1) return { name: 'about' };
  if (parts[0] === 'm' && parts.length === 2) return { name: 'person', slug: parts[1] };
  if (parts[0] === 'm' && parts.length === 3 && parts[2] === 'edit') return { name: 'edit', slug: parts[1] };
  return { name: 'notFound' };
}

export const href = (path: string) => `#${path}`;
export const personPath = (slug: string) => `/m/${encodeURIComponent(slug)}`;

export function navigate(path: string, { replace = false } = {}) {
  const target = href(path);
  if (replace) history.replaceState(null, '', target);
  else history.pushState(null, '', target);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute(): { route: Route; key: string } {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const update = () => setHash(location.hash);
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return { route: parseHash(hash), key: hash.split('?')[0] || '#/' };
}
