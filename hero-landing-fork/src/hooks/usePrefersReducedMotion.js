import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function getPrefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(QUERY).matches);
}

export function usePrefersReducedMotion() {
  // Starts at the server default; the effect syncs the real preference before
  // anything interactive happens, keeping hydration mismatch-free.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(QUERY);
    if (!mediaQuery) return undefined;

    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.('change', update);
    return () => mediaQuery.removeEventListener?.('change', update);
  }, []);

  return prefersReducedMotion;
}
