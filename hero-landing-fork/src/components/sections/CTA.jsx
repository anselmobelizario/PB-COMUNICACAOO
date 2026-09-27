import { ArrowRight, Phone } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';
import { siteData } from '../../data/siteData';
import WhatsAppIcon from '../ui/WhatsAppIcon';

export default function CTA() {
  const revealRef = useReveal();
  const trustPoints = siteData.ctaBanner.trustLine.split(' • ');

  return (
    <section id="orcamento" aria-labelledby="cta-heading" className="relative z-10 overflow-hidden bg-[var(--color-pb-surface)] px-6 py-6">
      <div ref={revealRef} className="reveal-section mx-auto max-w-7xl">
        <div className="cta-panel-light rounded-[2rem] p-8 sm:p-10 lg:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
            <div>
              <h2 id="cta-heading" className="section-kicker-light">Solicite seu orçamento</h2>

              <p className="mt-6 max-w-xl font-[var(--font-display)] text-xl font-medium leading-snug text-[var(--color-pb-accent-blue)] [text-wrap:pretty] sm:text-2xl lg:text-[1.75rem]">
                {siteData.ctaBanner.subheadline}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {trustPoints.map((item) => (
                  <span key={item} className="cta-trust-chip-light">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {siteData.ctaBanner.ctas.map((cta) => {
                if (cta.variant === 'primary') {
                  return (
                    <a
                      key={cta.text}
                      href={siteData.contact.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cta-primary-button group relative flex w-full items-center justify-between rounded-[1.35rem] px-6 py-5 font-semibold text-white"
                    >
                      <span className="flex items-center gap-3">
                        <WhatsAppIcon className="h-5 w-5" />
                        {cta.text}
                      </span>
                      <ArrowRight
                        size={20}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </a>
                  );
                }

                if (cta.variant === 'phone') {
                  return (
                    <a
                      key={cta.text}
                      href={siteData.contact.phoneLink}
                      className="cta-secondary-button-light editorial-surface-soft-light flex w-full items-center justify-between rounded-[1.35rem] px-6 py-5 text-[var(--color-pb-ink-2)]"
                    >
                      <span className="flex items-center gap-3">
                        <Phone size={20} strokeWidth={1.5} aria-hidden="true" />
                        {cta.text}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-pb-ink-2)]" style={{ opacity: 0.5 }}>Ligar</span>
                    </a>
                  );
                }

                return null;
              })}

              <div className="cta-contact-card-light editorial-surface-soft-light rounded-[1.35rem] px-6 py-5 text-sm text-[var(--color-pb-ink-2)]">
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-pb-ink-2)]" style={{ opacity: 0.5 }}>Contato direto</div>
                <a href={`mailto:${siteData.contact.email}`} className="mt-3 block text-[var(--color-pb-ink)] transition-colors hover:text-[var(--color-pb-accent-on-light)]">
                  {siteData.contact.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
