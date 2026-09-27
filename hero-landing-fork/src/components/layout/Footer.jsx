import { Phone, Mail } from 'lucide-react';
import { siteData } from '../../data/siteData';

const socialIcons = {
  facebook: (
    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="pb-instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FED373" />
          <stop offset="30%" stopColor="#F15245" />
          <stop offset="60%" stopColor="#D92E7F" />
          <stop offset="100%" stopColor="#9B36B7" />
        </linearGradient>
      </defs>
      <path fill="url(#pb-instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
};

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-black/[0.07] bg-[var(--color-pb-white)] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          {/* Brand */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <img
              src={siteData.company.logoSrc}
              srcSet="/assets/logo-240.webp 240w, /assets/logo-360.webp 360w, /assets/logo.webp 480w"
              sizes="133px"
              alt={siteData.company.name}
              width={siteData.company.logoWidth}
              height={siteData.company.logoHeight}
              loading="lazy"
              decoding="async"
              className="h-20 w-auto flex-shrink-0 self-start sm:h-24 sm:self-center"
            />
            <div>
              <h3 className="font-[var(--font-display)] text-lg sm:text-xl font-bold text-[var(--color-pb-ink)] mb-1.5">
                {siteData.company.name}
              </h3>
              <p className="text-sm text-[var(--color-pb-ink)] leading-relaxed max-w-md" style={{ opacity: 0.72 }}>
                {siteData.company.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-6 lg:flex-shrink-0 lg:flex-nowrap">
            {/* Contact */}
            <div>
              <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-pb-ink)] mb-3">Contato</p>
              <ul className="space-y-2 text-sm text-[var(--color-pb-ink-2)]">
                <li className="flex items-center gap-2">
                  <Phone size={16} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
                  <a href={siteData.contact.phoneLink} className="whitespace-nowrap hover:text-[var(--color-pb-ink)]">
                    {siteData.contact.phones}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={16} strokeWidth={1.5} className="flex-shrink-0" aria-hidden="true" />
                  <a href={`mailto:${siteData.contact.email}`} className="hover:text-[var(--color-pb-ink)]">
                    {siteData.contact.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-pb-ink)] mb-3">Redes Sociais</p>
              <div className="flex items-center gap-3">
                {siteData.social.map((s) => (
                  <a
                    key={s.icon}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="w-10 h-10 rounded-lg glass-strong-light flex items-center justify-center text-[var(--color-pb-ink-2)] hover:text-[var(--color-pb-ink)] transition-all"
                  >
                    {socialIcons[s.icon]}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-[var(--color-pb-ink-2)]">
            &copy; {new Date().getFullYear()} {siteData.footer.copyright}
          </p>
          <p className="text-xs text-[var(--color-pb-ink-2)]">
            {siteData.footer.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
