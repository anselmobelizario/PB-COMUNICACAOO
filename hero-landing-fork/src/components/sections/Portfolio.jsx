import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFlushColumns } from '../../hooks/useFlushColumns';
import { useReveal } from '../../hooks/useReveal';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getPrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { avifSrcSet, avifUrl, siteData } from '../../data/siteData';
import PortfolioVideoCarousel from './PortfolioVideoCarousel';
import ProjectMosaic from './PortfolioMosaic';

function Lightbox({ items, index, onClose, onPrev, onNext, onJump }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const stripRef = useRef(null);
  const previousFocusRef = useRef(null);
  const item = items[index];

  useScrollLock(true);

  useEffect(() => {
    // The dialog renders in a body portal; inerting the app root takes the
    // whole page behind it out of the tab order and off the pointer.
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    return () => root?.removeAttribute('inert');
  }, []);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    closeRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...dialog.querySelectorAll('button:not([disabled])')];
      if (!focusable.length) return;
      const currentIndex = focusable.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusable.length) % focusable.length
        : (currentIndex + 1) % focusable.length;
      event.preventDefault();
      focusable[nextIndex]?.focus();
    };

    // Document-level so Escape/arrows keep working after a pointer click moves
    // focus off the (non-focusable) dialog into <body>.
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    stripRef.current?.children[index]?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: getPrefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [index]);

  if (!item) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-lightbox-title"
      className="portfolio-lightbox fixed inset-0 z-[9999] flex flex-col items-center"
      onClick={onClose}
    >
      <h2 id="portfolio-lightbox-title" className="sr-only">Visualização do projeto</h2>

      <button
        ref={closeRef}
        type="button"
        className="portfolio-lightbox-close"
        onClick={(event) => { event.stopPropagation(); onClose(); }}
        aria-label="Fechar visualização"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden="true">
          <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="portfolio-lightbox-counter" aria-live="polite" aria-atomic="true">
        {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
      </div>

      <button
        type="button"
        className="portfolio-lightbox-arrow portfolio-lightbox-arrow-prev"
        onClick={(event) => { event.stopPropagation(); onPrev(); }}
        aria-label="Imagem anterior"
        disabled={index <= 0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        className="portfolio-lightbox-arrow portfolio-lightbox-arrow-next"
        onClick={(event) => { event.stopPropagation(); onNext(); }}
        aria-label="Próxima imagem"
        disabled={index >= items.length - 1}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="portfolio-lightbox-stage" onClick={(event) => event.stopPropagation()}>
        <picture>
          <source type="image/avif" srcSet={avifUrl(item.src)} />
          <img src={item.src} alt={item.alt} />
        </picture>
        <div className="portfolio-lightbox-caption">
          <span>{item.categoryLabel}</span>
        </div>
      </div>

      <div className="portfolio-lightbox-thumbnails" onClick={(event) => event.stopPropagation()}>
        <div ref={stripRef}>
          {items.map((thumbnail, thumbnailIndex) => (
            <button
              key={`${thumbnail.src}-${thumbnailIndex}`}
              type="button"
              className={thumbnailIndex === index ? 'is-active' : ''}
              onClick={() => onJump(thumbnailIndex)}
              aria-label={`Visualizar ${thumbnail.alt}`}
              aria-current={thumbnailIndex === index ? 'true' : undefined}
            >
              <picture>
                {thumbnail.srcSet && (
                  <source type="image/avif" srcSet={avifSrcSet(thumbnail.srcSet)} sizes="96px" />
                )}
                <img
                  src={thumbnail.src}
                  srcSet={thumbnail.srcSet}
                  sizes="96px"
                  alt=""
                  width={96}
                  height={64}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function countPortfolioImages(projects) {
  return projects.reduce((total, project) => total + project.images.length, 0);
}

export default function Portfolio() {
  const revealRef = useReveal();
  const { portfolio } = siteData;
  const [activeCategory, setActiveCategory] = useState(portfolio.categories[0].id);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef(null);
  const tabsRef = useRef(null);
  useFlushColumns(panelRef, activeCategory);

  const activeCategoryMeta = portfolio.categories.find(
    (category) => category.id === activeCategory,
  );
  const activeCategoryLabel = activeCategoryMeta?.label;
  const videoCount = portfolio.videos.length;

  const categoryStats = useMemo(() => {
    const stats = new Map();
    for (const project of portfolio.projects) {
      const entry = stats.get(project.category) ?? { projectCount: 0, imageCount: 0 };
      entry.projectCount += 1;
      entry.imageCount += project.images.length;
      stats.set(project.category, entry);
    }
    return stats;
  }, [portfolio.projects]);

  const filteredProjects = useMemo(() => (
    portfolio.projects.filter((project) => project.category === activeCategory)
  ), [portfolio.projects, activeCategory]);
  const categoryImages = countPortfolioImages(filteredProjects);

  const photoTiles = useMemo(() => (
    filteredProjects.flatMap((project) => (
      project.images.map((image, imageIndex) => ({
        ...image,
        key: `${project.id}-${imageIndex}`,
        categoryLabel: activeCategoryLabel,
      }))
    ))
  ), [filteredProjects, activeCategoryLabel]);

  const projectStartIndices = useMemo(() => {
    const indices = [];
    let runningTotal = 0;
    for (const project of filteredProjects) {
      indices.push(runningTotal);
      runningTotal += project.images.length;
    }
    return indices;
  }, [filteredProjects]);

  useEffect(() => {
    const onFilterRequest = (event) => {
      const category = portfolio.categories.find((item) => item.label === event.detail);
      if (category) {
        setLightboxIndex(null);
        startTransition(() => setActiveCategory(category.id));
      }
    };

    window.addEventListener('pb:filter-portfolio', onFilterRequest);
    return () => window.removeEventListener('pb:filter-portfolio', onFilterRequest);
  }, [portfolio.categories, startTransition]);

  const selectCategory = (categoryId) => {
    setLightboxIndex(null);
    startTransition(() => setActiveCategory(categoryId));
  };

  // ARIA tabs pattern: arrows move selection with a roving tabindex, so the
  // five tabs stop flooding the Tab order.
  const handleTablistKeyDown = (event) => {
    const ids = portfolio.categories.map((category) => category.id);
    const current = ids.indexOf(activeCategory);
    let nextId;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextId = ids[(current + 1) % ids.length];
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextId = ids[(current - 1 + ids.length) % ids.length];
        break;
      case 'Home':
        nextId = ids[0];
        break;
      case 'End':
        nextId = ids[ids.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    selectCategory(nextId);
    requestAnimationFrame(() => {
      tabsRef.current?.querySelector(`#portfolio-tab-${CSS.escape(nextId)}`)?.focus();
    });
  };

  const lightboxItemCount = photoTiles.length;
  const isVideoOnly = Boolean(activeCategoryMeta?.videoOnly);
  const hasProductionVideos = portfolio.videos.length > 0;
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => {
    setLightboxIndex((current) => (current === null || current <= 0 ? current : current - 1));
  };
  const nextImage = () => {
    setLightboxIndex((current) => (
      current === null || current >= lightboxItemCount - 1 ? current : current + 1
    ));
  };
  const jumpImage = (index) => setLightboxIndex(index);

  const productionBlock = hasProductionVideos ? (
    <div className="portfolio-production">
      <div className="portfolio-production-header">
        <div>
          <span className="section-kicker-light">Bastidores</span>
          <h2>Essência P&B</h2>
        </div>
        <p>Vídeos de instalação, frota e produção interna.</p>
      </div>
      <PortfolioVideoCarousel videos={portfolio.videos} />
    </div>
  ) : null;

  return (
    <section
      id="portfolio"
      className="portfolio-section relative z-10 overflow-hidden bg-[var(--color-pb-surface)] px-6 py-6"
      aria-labelledby="portfolio-heading"
    >
      <div ref={revealRef} className="reveal-section mx-auto max-w-7xl">
        <div className="portfolio-header">
          <div>
            <span className="section-kicker-light">Trabalhos realizados</span>
            <h2 id="portfolio-heading">{portfolio.title}</h2>
            <p>{portfolio.subheadline}</p>
          </div>
          <div className="portfolio-project-count" aria-live="polite">
            <span className="sr-only">
              {isVideoOnly
                ? `${videoCount} ${videoCount === 1 ? 'vídeo' : 'vídeos'} em ${activeCategoryLabel}`
                : `${filteredProjects.length} ${filteredProjects.length === 1 ? 'projeto' : 'projetos'}, ${categoryImages} ${categoryImages === 1 ? 'foto' : 'fotos'} em ${activeCategoryLabel}`}
            </span>
            {isVideoOnly ? (
              <>
                <strong aria-hidden="true">{videoCount}</strong>
                <span aria-hidden="true">{videoCount === 1 ? 'vídeo' : 'vídeos'}</span>
              </>
            ) : (
              <>
                <strong aria-hidden="true">{filteredProjects.length}</strong>
                <span aria-hidden="true">{filteredProjects.length === 1 ? 'projeto' : 'projetos'}</span>
                <span className="portfolio-project-count-divider" aria-hidden="true">·</span>
                <strong aria-hidden="true">{categoryImages}</strong>
                <span aria-hidden="true">{categoryImages === 1 ? 'foto' : 'fotos'}</span>
              </>
            )}
            <span className="portfolio-project-count-note" aria-hidden="true">
              em {activeCategoryLabel}
            </span>
          </div>
        </div>

        <div
          ref={tabsRef}
          className="portfolio-tabs"
          role="tablist"
          aria-label="Categorias do portfólio"
          onKeyDown={handleTablistKeyDown}
        >
          {portfolio.categories.map((category) => {
            const isActive = category.id === activeCategory;
            const { projectCount = 0, imageCount = 0 } = categoryStats.get(category.id) ?? {};

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                id={`portfolio-tab-${category.id}`}
                aria-selected={isActive}
                aria-controls={isActive ? `portfolio-panel-${category.id}` : undefined}
                tabIndex={isActive ? 0 : -1}
                className={isActive ? 'is-active' : ''}
                onClick={() => selectCategory(category.id)}
              >
                <span className="portfolio-tab-label">{category.label}</span>
                <span className="portfolio-tab-meta">
                  {category.videoOnly
                    ? `${videoCount} vídeos`
                    : `${projectCount} · ${imageCount} fotos`}
                </span>
              </button>
            );
          })}
        </div>

        <div
          ref={panelRef}
          id={`portfolio-panel-${activeCategory}`}
          className={
            isVideoOnly
              ? 'portfolio-tabpanel-videos'
              : filteredProjects.length
                ? 'portfolio-mosaic-columns'
                : 'portfolio-mosaic-columns is-empty'
          }
          role="tabpanel"
          aria-labelledby={`portfolio-tab-${activeCategory}`}
          aria-busy={isPending}
        >
          {isVideoOnly
            ? productionBlock
            : filteredProjects.map((project, projectIndex) => (
              <ProjectMosaic
                key={project.id}
                project={project}
                categoryLabel={activeCategoryLabel}
                startIndex={projectStartIndices[projectIndex]}
                onOpenLightbox={openLightbox}
              />
            ))}
        </div>

        {!isVideoOnly && productionBlock}
      </div>

      {lightboxIndex !== null && lightboxIndex < lightboxItemCount && createPortal(
        <Lightbox
          items={photoTiles}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
          onJump={jumpImage}
        />,
        document.body,
      )}
    </section>
  );
}
