import { useEffect, useRef, useState } from 'preact/hooks';
import { onChange } from './db';
import { getImage } from './store';

/** Loads data and loads it again whenever anything is saved (in this tab or another one). */
export function useLive<T>(load: () => Promise<T>, deps: unknown[]): { data: T | undefined; error: unknown; loading: boolean } {
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>({ data: undefined, error: null, loading: true });
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let active = true;
    let run = 0;
    const refresh = () => {
      const mine = ++run;
      loadRef.current().then(
        (data) => active && mine === run && setState({ data, error: null, loading: false }),
        (error) => active && mine === run && setState((s) => ({ ...s, error, loading: false })),
      );
    };
    setState((s) => ({ ...s, loading: true }));
    refresh();
    const stop = onChange(refresh);
    return () => {
      active = false;
      stop();
    };
  }, deps);

  return state;
}

/** An address for showing a stored image; given back to the browser when no longer shown. */
export function useImageUrl(imageId: string | null | undefined, variant: 'thumb' | 'full'): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!imageId) {
      setUrl(null);
      return;
    }
    let active = true;
    let created: string | null = null;
    getImage(imageId).then((image) => {
      if (!active || !image) return;
      created = URL.createObjectURL(image[variant]);
      setUrl(created);
    });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [imageId, variant]);
  return url;
}
