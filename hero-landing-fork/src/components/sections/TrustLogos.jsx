import { useRef } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { getPrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { siteData, assetUrl, avifUrl } from '../../data/siteData';

const FILL_LOGOS = {
  Sonda: 'client-logo-card--sonda',
  Adias: 'client-logo-card--adias',
};

function ClientLogoRail({ logos }) {
  const trackRef = useRef(null);
  const isSettlingRef = useRef(false);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track || isSettlingRef.current) return;
    const cards = Array.from(track.querySelectorAll('.client-logo-card'));
    if (cards.length < 2) return;

    const behavior = getPrefersReducedMotion() ? 'auto' : 'smooth';
    const maxScrollLeft = track.scrollWidth - track.clientWidth;

    if (behavior === 'smooth') {
      isSettlingRef.current = true;
      const release = () => { isSettlingRef.current = false; };
      track.addEventListener('scrollend', release, { once: true });
      // Safety net for browsers without `scrollend` (e.g. older Safari).
      setTimeout(release, 600);
    }

    // Wrap at the ends instead of relying on a scroll target that the
    // browser can't reach (there's no track width left to scroll into).
    if (direction > 0 && track.scrollLeft >= maxScrollLeft - 1) {
      track.scrollTo({ left: 0, behavior });
      return;
    }
    if (direction < 0 && track.scrollLeft <= 1) {
      track.scrollTo({ left: maxScrollLeft, behavior });
      return;
    }

    // Step by the width of the card actually adjacent to the current
    // scroll position, not a fixed width guessed from the first card —
    // cards have different widths (see FILL_LOGOS).
    const trackLeft = track.getBoundingClientRect().left;
    const lefts = cards.map((card) => card.getBoundingClientRect().left - trackLeft);
    const activeIndex = lefts.reduce((closest, left, index) => (left <= 1 ? index : closest), 0);
    const neighborIndex = activeIndex + direction;
    const delta = neighborIndex >= 0 && neighborIndex < cards.length
      ? Math.abs(lefts[neighborIndex] - lefts[activeIndex])
      : cards[activeIndex].getBoundingClientRect().width;

    track.scrollBy({ left: direction * delta, behavior });
  };

  return (
    <div className="client-logo-rail">
      <button
        type="button"
        className="client-logo-nav"
        onClick={() => scrollByCard(-1)}
        aria-label="Ver clientes anteriores"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <ul className="client-logo-track" ref={trackRef}>
        {logos.map((logo) => {
          const fillClass = FILL_LOGOS[logo.name];
          return (
            <li
              key={logo.name}
              className={`client-logo-card${fillClass ? ` client-logo-card--fill ${fillClass}` : ''}`}
            >
              <picture>
                <source type="image/avif" srcSet={avifUrl(logo.src)} />
                <img
                  src={assetUrl(logo.src)}
                  alt={`${logo.name}, cliente da P&B`}
                  width={220}
                  height={100}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="client-logo-nav"
        onClick={() => scrollByCard(1)}
        aria-label="Ver próximos clientes"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default function TrustLogos() {
  const revealRef = useReveal();
  const { clients } = siteData;

  return (
    <section
      className="clients-section relative z-10 bg-[var(--color-pb-surface)] px-6 py-4"
      aria-label={clients.label}
    >
      <div ref={revealRef} className="reveal-section">
        <div className="mx-auto max-w-7xl">
          <span className="section-kicker-light">{clients.label}</span>
          <h2 className="mt-4 max-w-xl font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--color-pb-accent-blue)] sm:text-3xl">
            Clientes que confiam no nosso trabalho
          </h2>
        </div>

        <div className="client-logo-marquee mx-auto mt-8 max-w-7xl">
          <ClientLogoRail logos={clients.logos} />
        </div>
      </div>
    </section>
  );
}
