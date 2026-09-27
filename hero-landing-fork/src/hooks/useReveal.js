import { useEffect, useRef } from 'react';

const REVEAL_FAILSAFE_MS = 4000;

export function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    el.classList.add('reveal-ready');

    let frameId = null;
    let timeoutId = null;
    let revealed = false;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      frameId = window.requestAnimationFrame(() => {
        el.classList.add('visible');
      });
    };

    // No getBoundingClientRect here: the observer delivers the current
    // intersection right after observe(), without a forced layout.
    if (!('IntersectionObserver' in window)) {
      reveal();
      return () => {
        if (frameId !== null) window.cancelAnimationFrame(frameId);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: '0px 0px 8% 0px' },
    );

    observer.observe(el);
    timeoutId = window.setTimeout(reveal, REVEAL_FAILSAFE_MS);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return ref;
}
