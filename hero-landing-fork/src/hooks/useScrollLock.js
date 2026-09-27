import { useEffect } from 'react';

let lockCount = 0;
let previousOverflow = '';

function acquireLock() {
  if (lockCount === 0) {
    // The viewport scroller is the <html> element (body overflow never
    // propagates past html{overflow-x:hidden}), so the lock must land there.
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.classList.add('pb-scroll-locked');
  }
  lockCount += 1;
}

function releaseLock() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.documentElement.style.overflow = previousOverflow;
    document.documentElement.classList.remove('pb-scroll-locked');
  }
}

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    acquireLock();
    return releaseLock;
  }, [active]);
}
