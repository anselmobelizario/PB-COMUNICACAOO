import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, Phone, X } from 'lucide-react';
import { siteData, assetUrl } from '../../data/siteData';
import { useScrollLock } from '../../hooks/useScrollLock';
import WhatsAppIcon from '../ui/WhatsAppIcon';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef(null);
  const hamburgerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled((previous) => (previous === isScrolled ? previous : isScrolled));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useScrollLock(menuOpen);

  useEffect(() => {
    // The drawer lives inside the app root, so the background is inerted per
    // element (nav, content, footer) instead of inerting the root itself.
    if (!menuOpen) return undefined;
    const background = [
      document.querySelector('nav.site-navbar'),
      document.getElementById('content'),
      document.querySelector('footer'),
    ].filter(Boolean);
    background.forEach((el) => el.setAttribute('inert', ''));
    return () => background.forEach((el) => el.removeAttribute('inert'));
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !drawerRef.current) return undefined;

    const drawer = drawerRef.current;
    const focusable = drawer.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    firstFocusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !focusable.length) return;

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    drawer.addEventListener('keydown', handleKeyDown);
    return () => drawer.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      hamburgerRef.current?.focus();
    });
  };

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className={`site-navbar site-navbar--liquid fixed left-0 right-0 top-0 z-[100] transition-shadow duration-300 ${
          scrolled ? 'is-scrolled' : ''
        }`}
      >
        <div className="site-navbar__inner flex items-center justify-end gap-4">
          <div className="site-navbar__links hidden items-center justify-end gap-2 md:flex lg:gap-2.5">
            {siteData.nav.links.map((link) => (
              <a key={link.href} href={link.href} className="nav-chip">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center justify-end md:hidden">
            <button
              ref={hamburgerRef}
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-pb-ink-2)] transition-colors hover:text-[var(--color-pb-ink)]"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-controls={menuOpen ? 'mobile-navigation-drawer' : undefined}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((previous) => !previous)}
            >
              {menuOpen ? (
                <X size={24} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Menu size={24} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div
            className="nav-drawer-backdrop fixed inset-0 z-[99] bg-[rgba(10,14,30,0.45)] backdrop-blur-[2px] md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div
            id="mobile-navigation-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="nav-drawer fixed right-0 top-0 z-[101] flex flex-col rounded-bl-[1.75rem] border-b border-l border-black/[0.08] bg-white text-[var(--color-pb-ink)] shadow-2xl md:hidden"
            style={{ right: 0, left: 'auto', width: 'min(20rem, 88vw)', maxWidth: '100vw' }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-pb-accent)] to-[var(--color-pb-accent-blue)]"
            />
            <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
              <img
                src={assetUrl('/assets/logo-240.webp')}
                alt={siteData.company.name}
                width={240}
                height={173}
                className="h-12 w-auto"
              />
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-[#fbfbfc] text-[var(--color-pb-ink-2)] transition-colors hover:border-[rgba(0,4,225,0.25)] hover:text-[var(--color-pb-accent-blue)]"
                aria-label={siteData.nav.mobileMenuCloseLabel}
                onClick={closeMenu}
              >
                <X size={22} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Menu mobile" className="min-h-0 overflow-y-auto px-5 py-5">
              <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-[#fcfcfd] shadow-[0_10px_28px_rgba(29,29,31,0.05)]">
                {siteData.nav.links.map((link, index) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`nav-drawer-link group flex items-center gap-4 px-4 py-3.5 ${
                      index < siteData.nav.links.length - 1 ? 'border-b border-black/[0.06]' : ''
                    }`}
                    style={{ animationDelay: `${90 + index * 50}ms` }}
                    onClick={closeMenu}
                  >
                    <span className="nav-drawer-link-index font-[var(--font-display)] text-[0.7rem] font-bold tracking-[0.2em] text-[var(--color-pb-accent)] transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 font-[var(--font-display)] text-[1rem] font-semibold tracking-tight text-[var(--color-pb-ink)]">
                      {link.label}
                    </span>
                    <ArrowRight
                      size={17}
                      strokeWidth={2}
                      className="nav-drawer-link-arrow text-[var(--color-pb-accent-blue)]"
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </nav>

            <div className="border-t border-black/[0.06] px-5 py-5">
              <a
                href={siteData.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-3 py-3.5 font-[var(--font-display)] text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,211,102,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#1fae55]"
              >
                <WhatsAppIcon className="h-[19px] w-[19px]" />
                Solicite seu Orçamento
              </a>
              <div className="mt-3 flex items-center justify-center gap-2 text-[0.8rem] font-medium text-[var(--color-pb-ink-2)]">
                <Phone size={14} strokeWidth={1.75} aria-hidden="true" />
                <a
                  href={siteData.contact.phoneLink}
                  className="transition-colors hover:text-[var(--color-pb-ink)]"
                >
                  (11) 3836-0196
                </a>
                <span aria-hidden="true">/</span>
                <a
                  href={siteData.contact.phoneLink2}
                  className="transition-colors hover:text-[var(--color-pb-ink)]"
                >
                  {siteData.contact.phone2}
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
