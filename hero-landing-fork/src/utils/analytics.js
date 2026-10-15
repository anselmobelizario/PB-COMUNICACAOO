// Pushes to the GTM dataLayer. No-op during SSR/prerender, where there is
// no window, and when GTM isn't loaded (dev/preview builds without
// VITE_GTM_ID) — dataLayer.push queues harmlessly either way, but the guard
// keeps the SSR render from throwing.
export function pushEvent(event, params = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
