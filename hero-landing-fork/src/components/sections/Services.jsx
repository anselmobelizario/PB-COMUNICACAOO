import { useEffect, useState } from 'react';
import { Car, Flag, PaintRoller, Store } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';
import { getPrefersReducedMotion, usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { gallerySrcSet, galleryUrl, siteData } from '../../data/siteData';

const SERVICE_IMAGE_SIZES = '(min-width: 768px) 38rem, 92vw';

const SERVICE_ICONS = {
  vehicle: <Car size={26} strokeWidth={1.5} aria-hidden="true" />,
  general: <PaintRoller size={26} strokeWidth={1.5} aria-hidden="true" />,
  banner: <Flag size={26} strokeWidth={1.5} aria-hidden="true" />,
  pdv: <Store size={26} strokeWidth={1.5} aria-hidden="true" />,
};

const DEFAULT_SERVICE_ICON = SERVICE_ICONS.general;

function ServiceNavTabs({ items, activeIndex, onTabClick }) {
  return (
    <div className="mb-12 flex flex-wrap items-center justify-center gap-2" aria-label="Categorias de serviços">
      {items.map((item, index) => (
        <button
          key={item.category}
          type="button"
          onClick={() => onTabClick(index)}
          className={`service-nav-tab-light${activeIndex === index ? ' active' : ''}`}
          aria-pressed={activeIndex === index}
        >
          {item.category}
        </button>
      ))}
    </div>
  );
}

function normalizeGalleryEntry(entry) {
  if (typeof entry === 'string') return { src: entry };
  if (entry && typeof entry.src === 'string') {
    const normalized = { src: entry.src };
    if (entry.objectPosition) normalized.objectPosition = entry.objectPosition;
    if (entry.objectFit) normalized.objectFit = entry.objectFit;
    return normalized;
  }
  return { src: '' };
}

function resolveServiceGallery(service) {
  const primary = normalizeGalleryEntry(service.image);
  const fromGallery = (service.gallery?.length ? service.gallery : []).map(normalizeGalleryEntry);
  const entries = (fromGallery.length ? fromGallery : primary.src ? [primary] : []).filter(
    (item) => item.src,
  );

  if (!entries.length) return [];

  // Primary `image` may carry framing while gallery[0] is a plain string.
  return entries.map((item, index) => {
    if (index !== 0 || !primary.src || item.src !== primary.src) return item;

    const next = { ...item };
    if (primary.objectPosition && !item.objectPosition) {
      next.objectPosition = primary.objectPosition;
    }
    if (primary.objectFit && !item.objectFit) {
      next.objectFit = primary.objectFit;
    }
    return next;
  });
}

function ServiceCard({ service, index, ctaText }) {
  const revealRef = useReveal();
  const [slide, setSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isEngaged, setIsEngaged] = useState(false);
  const isReducedMotion = usePrefersReducedMotion();
  const num = String(index + 1).padStart(2, '0');
  const gallery = resolveServiceGallery(service);

  useEffect(() => {
    const card = revealRef.current;
    if (!card || typeof IntersectionObserver === 'undefined') return undefined;

    // Offscreen intervals used to run forever, four cards at a time.
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [revealRef]);

  useEffect(() => {
    // Paused while hovered or focused too — WCAG 2.2.2.
    if (isReducedMotion || isEngaged || !isVisible || gallery.length < 2) return undefined;

    const interval = window.setInterval(() => {
      setSlide((current) => (current + 1) % gallery.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [gallery.length, isEngaged, isReducedMotion, isVisible]);

  const goToPortfolio = (event) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('pb:filter-portfolio', { detail: service.category }));
    requestAnimationFrame(() => {
      document.getElementById('portfolio')?.scrollIntoView({
        behavior: isReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  };

  return (
    <div
      id={`service-card-${index}`}
      ref={revealRef}
      className="reveal-section"
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <a
        href="#portfolio"
        onClick={goToPortfolio}
        onMouseEnter={() => setIsEngaged(true)}
        onMouseLeave={() => setIsEngaged(false)}
        onFocus={() => setIsEngaged(true)}
        onBlur={() => setIsEngaged(false)}
        className="service-card group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-500 md:flex-row"
        aria-label={`Ver portfólio: ${service.title}`}
      >
        <span aria-hidden="true" className="service-card-number">
          {num}
        </span>

        <div className="service-card-media relative flex-shrink-0 overflow-hidden md:w-[55%]">
          {gallery.map((item, galleryIndex) => (
            <img
              key={item.src}
              src={galleryUrl(item.src)}
              srcSet={gallerySrcSet(item.src)}
              sizes={SERVICE_IMAGE_SIZES}
              alt={galleryIndex === slide ? service.title : ''}
              aria-hidden={galleryIndex === slide ? undefined : 'true'}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
              style={{
                zIndex: galleryIndex === slide ? 2 : 1,
                opacity: galleryIndex === slide ? 1 : 0,
                ...(item.objectPosition ? { objectPosition: item.objectPosition } : null),
                ...(item.objectFit ? { objectFit: item.objectFit } : null),
              }}
              loading="lazy"
              decoding="async"
            />
          ))}
          <div className="service-media-overlay" aria-hidden="true" />

          {gallery.length > 1 && (
            <div className="service-slide-indicators" aria-hidden="true">
              {gallery.map((item, galleryIndex) => (
                <span
                  key={item.src}
                  className={galleryIndex === slide ? 'is-active' : ''}
                />
              ))}
            </div>
          )}
        </div>

        <div className="service-card-content relative flex flex-col justify-between gap-5 p-8 md:w-[45%] md:p-10">
          <div className="flex items-center gap-3">
            <div className="service-icon" aria-hidden="true">
              {SERVICE_ICONS[service.icon] ?? DEFAULT_SERVICE_ICON}
            </div>
            <span className="category-badge-light">{service.category}</span>
          </div>

          <div>
            <span className="service-card-index">{num}</span>
            <h3 className="mt-3 font-[var(--font-display)] text-xl font-bold leading-tight text-[var(--color-pb-ink)] sm:text-2xl lg:text-[1.6rem]">
              {service.title}
            </h3>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-pb-muted)] sm:text-base">
            {service.description}
          </p>

          {service.specs?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {service.specs.map((spec) => (
                <span key={spec} className="spec-tag-light">{spec}</span>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2.5">
            <span aria-hidden="true" className="service-metric-dot" />
            <span className="text-xs font-medium uppercase leading-snug tracking-wider text-[var(--color-pb-ink-2)]">
              {service.metric}
            </span>
          </div>

          <div className="service-card-cta" aria-hidden="true">
            {ctaText}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </a>
    </div>
  );
}

export default function Services() {
  const headerRevealRef = useReveal();
  const { services } = siteData;
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index) => {
    setActiveTab(index);
    document.getElementById(`service-card-${index}`)?.scrollIntoView({
      behavior: getPrefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  return (
    <section id="servicos" aria-labelledby="servicos-heading" className="services-section relative z-10 bg-[var(--color-pb-white)] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <div ref={headerRevealRef} className="reveal-section mb-10 text-center">
          <span className="section-kicker-light">{services.label}</span>
          <h2 id="servicos-heading" className="mt-6 font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-pb-accent-blue)] sm:text-4xl md:text-5xl">
            {services.headline.before} {services.headline.accent}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--color-pb-ink-2)]">
            {services.subheadline}
          </p>
        </div>

        <ServiceNavTabs items={services.items} activeIndex={activeTab} onTabClick={handleTabClick} />

        <div className="flex flex-col gap-5">
          {services.items.map((service, index) => (
            <ServiceCard key={service.category} service={service} index={index} ctaText={services.ctaText} />
          ))}
        </div>
      </div>
    </section>
  );
}
