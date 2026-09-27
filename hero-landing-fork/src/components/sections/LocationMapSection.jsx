import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ArrowUpRight } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';
import { siteData } from '../../data/siteData';

// When VITE_GOOGLE_MAPS_EMBED_KEY is set, use the official Maps Embed API
// (free up to ~14k views/month). Otherwise, fall back to the unofficial
// `?output=embed` URL that works today but is not guaranteed by Google.
function resolveMapUrl(location) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY;
  if (!key) return location.embedUrl;
  return (
    `https://www.google.com/maps/embed/v1/place?key=${key}` +
    `&q=${location.lat},${location.lng}&zoom=${location.zoom}&language=pt-BR`
  );
}

export default function LocationMapSection() {
  const revealRef = useReveal();
  const frameRef = useRef(null);
  // The embed pulls ~1.6 MB of Google script on every page load, so the src
  // only goes in when the section closes in on the viewport (or never, for
  // crawlers — the address and the maps links carry that job).
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const { contact, company } = siteData;
  const { location } = contact;
  const mapUrl = resolveMapUrl(location);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-2019 browsers get the map right away
      setShouldLoadMap(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoadMap(true);
        observer.disconnect();
      },
      { rootMargin: '600px 0px' },
    );

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="localizacao"
      aria-labelledby="localizacao-heading"
      className="relative z-10 bg-[var(--color-pb-surface)] px-6 py-6"
    >
      <div ref={revealRef} className="reveal-section mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:items-start lg:gap-16">
          <div>
            <span className="section-kicker-light">Nossa Localização</span>
            <h2 id="localizacao-heading" className="mt-6 font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-pb-accent-blue)] sm:text-4xl md:text-5xl">
              Estamos na{' '}
              <span className="accent-text-light">Lapa</span>,{' '}
              <br className="hidden sm:block" />
              São Paulo
            </h2>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin
                  size={18}
                  strokeWidth={1.5}
                  className="mt-0.5 flex-shrink-0 text-[var(--color-pb-accent-on-light)]"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-base text-[var(--color-pb-ink)]">{contact.address}</p>
                  <p className="mt-1 text-sm text-[var(--color-pb-ink-2)]">{contact.cep}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-[var(--color-pb-ink-2)]">
                <span
                  className="mt-[5px] h-[10px] w-[10px] flex-shrink-0 rounded-full bg-[var(--color-pb-accent-blue)] opacity-60"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed">{contact.addressHint}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="location-action-btn-light editorial-surface-soft-light"
              >
                <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                Abrir no Google Maps
              </a>
              <a
                href={location.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="location-action-btn-light editorial-surface-soft-light"
              >
                <Navigation size={16} strokeWidth={1.5} aria-hidden="true" />
                Traçar rota
              </a>
            </div>
          </div>

          <div ref={frameRef} className="map-frame-light overflow-hidden rounded-[1.75rem]">
            {mapFailed || !shouldLoadMap ? (
              <MapFallback
                address={contact.address}
                googleMapsUrl={location.googleMapsUrl}
              />
            ) : (
              <iframe
                title={`Mapa de localização — ${company.name}`}
                src={mapUrl}
                width={640}
                height={520}
                className="block h-[320px] w-full border-0 sm:h-[420px] lg:h-[520px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onError={() => setMapFailed(true)}
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MapFallback({ address, googleMapsUrl }) {
  return (
    <div className="map-fallback-light h-[320px] sm:h-[420px] lg:h-[520px]">
      <MapPin size={32} strokeWidth={1.5} aria-hidden="true" />
      <p className="text-sm">{address}</p>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[var(--color-pb-accent-on-light)] hover:underline"
      >
        Ver no Google Maps →
      </a>
    </div>
  );
}
