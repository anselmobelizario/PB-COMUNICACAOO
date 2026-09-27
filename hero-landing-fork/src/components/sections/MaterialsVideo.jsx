import { useEffect, useRef, useState } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { siteData, assetUrl, avifUrl } from '../../data/siteData';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function MaterialsVideoCarousel({ videos }) {
  const figureRef = useRef(null);
  const mediaRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // Browser-dependent values start at the server-rendered default and sync in
  // effects, so hydration never sees a mismatch.
  const [isInView, setIsInView] = useState(false);
  const [readyById, setReadyById] = useState({});
  const [errorById, setErrorById] = useState({});
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isPlaybackEnabled, setIsPlaybackEnabled] = useState(true);

  const videoCount = videos.length;
  const activeVideo = videos[activeIndex];
  const activeHasError = Boolean(activeVideo && errorById[activeVideo.id]);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return undefined;
    // Pre-2019 browsers: keep the carousel playing rather than crashing.
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '180px 0px' },
    );

    observer.observe(figure);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!mediaQuery) return undefined;

    const handlePreferenceChange = (event) => {
      setIsReducedMotion(event.matches);
      if (event.matches) setIsPlaybackEnabled(false);
    };

    handlePreferenceChange({ matches: mediaQuery.matches });
    mediaQuery.addEventListener?.('change', handlePreferenceChange);
    return () => mediaQuery.removeEventListener?.('change', handlePreferenceChange);
  }, []);

  useEffect(() => {
    mediaRefs.current.forEach((media, index) => {
      if (!media) return;

      media.muted = true;
      const video = videos[index];
      const isActive = index === activeIndex;
      const hasError = Boolean(video && errorById[video.id]);

      if (isActive && isInView && isPlaybackEnabled && !hasError) {
        if (media.ended) media.currentTime = 0;
        media.play()?.catch?.((error) => {
          // Autoplay rejected (e.g. iOS Low Power Mode): flip the toggle back
          // so it doesn't claim the carousel is still playing.
          if (error?.name === 'NotAllowedError') setIsPlaybackEnabled(false);
        });
      } else {
        media.pause();
      }
    });
  }, [activeIndex, errorById, isInView, isPlaybackEnabled, videos]);

  if (!activeVideo) return null;

  const shouldPlay = isInView && isPlaybackEnabled && !activeHasError;

  const goTo = (targetIndex) => {
    if (videoCount < 2 || targetIndex === activeIndex || targetIndex < 0 || targetIndex >= videoCount) {
      return;
    }
    setActiveIndex(targetIndex);
  };

  const goToPrevious = () => goTo((activeIndex - 1 + videoCount) % videoCount);
  const goToNext = () => goTo((activeIndex + 1) % videoCount);

  const handleVideoEnded = () => {
    if (videoCount > 1 && isPlaybackEnabled && !isReducedMotion) {
      goToNext();
      return;
    }
    setIsPlaybackEnabled(false);
  };

  return (
    <div
      ref={figureRef}
      className="materials-video"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Vídeos de materiais e aplicações"
    >
      <div
        className="materials-video-frame"
        style={{ aspectRatio: `${activeVideo.width} / ${activeVideo.height}` }}
      >
        {videos.map((video, index) => {
          const isActive = index === activeIndex;
          const isReady = Boolean(readyById[video.id]);
          const hasError = Boolean(errorById[video.id]);

          return (
            <div
              key={video.id}
              className={`materials-video-slide${isActive ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={video.alt}
              aria-hidden={!isActive}
            >
              <picture>
                <source type="image/avif" srcSet={avifUrl(video.poster)} />
                <img
                  className={isReady && isActive && shouldPlay ? 'is-hidden' : ''}
                  src={assetUrl(video.poster)}
                  alt={isActive ? video.alt : ''}
                  width={video.width}
                  height={video.height}
                  loading={isActive && isInView ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </picture>
              {!hasError && (
                <video
                  ref={(node) => {
                    mediaRefs.current[index] = node;
                  }}
                  className={isReady ? 'is-ready' : ''}
                  autoPlay={isActive && shouldPlay}
                  muted
                  playsInline
                  disablePictureInPicture
                  disableRemotePlayback
                  preload={isActive && shouldPlay ? 'auto' : 'none'}
                  // No poster: the lazy <img> twin above already shows it, and
                  // an eager poster attr pulled every slide's image up front.
                  width={video.width}
                  height={video.height}
                  tabIndex={-1}
                  onPlaying={() => {
                    setReadyById((current) => ({ ...current, [video.id]: true }));
                  }}
                  onEnded={isActive ? handleVideoEnded : undefined}
                >
                  <source
                    src={assetUrl(video.src)}
                    type="video/mp4"
                    onError={() => {
                      setErrorById((current) => ({ ...current, [video.id]: true }));
                      setReadyById((current) => ({ ...current, [video.id]: false }));
                      if (isActive) setIsPlaybackEnabled(false);
                    }}
                  />
                  Seu navegador não consegue reproduzir este vídeo.
                </video>
              )}
            </div>
          );
        })}
      </div>

      <div className="materials-video-caption">
        <div className="materials-video-controls" role="group" aria-label="Controles do carrossel de materiais">
          {videoCount > 1 && (
            <button
              type="button"
              className="materials-video-control"
              onClick={goToPrevious}
              aria-label={`Vídeo anterior: ${videos[(activeIndex - 1 + videoCount) % videoCount].label}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="materials-video-control is-primary"
            onClick={() => setIsPlaybackEnabled((current) => !current)}
            aria-label={`${isPlaybackEnabled ? 'Pausar' : 'Reproduzir'} vídeo: ${activeVideo.label}`}
          >
            {isPlaybackEnabled ? (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 5.5A1.5 1.5 0 0 1 8.5 4h1A1.5 1.5 0 0 1 11 5.5v13A1.5 1.5 0 0 1 9.5 20h-1A1.5 1.5 0 0 1 7 18.5v-13Zm6 0A1.5 1.5 0 0 1 14.5 4h1A1.5 1.5 0 0 1 17 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-13Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8.5 5.2v13.6a1.2 1.2 0 0 0 1.84 1.02l9.1-6.8a1.27 1.27 0 0 0 0-2.04l-9.1-6.8A1.2 1.2 0 0 0 8.5 5.2Z" />
              </svg>
            )}
          </button>
          {videoCount > 1 && (
            <button
              type="button"
              className="materials-video-control"
              onClick={goToNext}
              aria-label={`Próximo vídeo: ${videos[(activeIndex + 1) % videoCount].label}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {videoCount > 1 && (
        <div className="materials-video-progress">
          <div className="materials-video-dots" role="group" aria-label="Selecionar vídeo de materiais">
            {videos.map((video, index) => (
              <button
                key={video.id}
                type="button"
                className={`materials-video-dot${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => goTo(index)}
                aria-label={`Mostrar vídeo ${index + 1} de ${videoCount}: ${video.label}`}
                aria-pressed={index === activeIndex}
              />
            ))}
          </div>
          <span className="materials-video-counter" aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')} / {String(videoCount).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MaterialsVideo() {
  const revealRef = useReveal();
  const { materials } = siteData;

  if (!materials?.videos?.length) return null;

  return (
    <section
      className="materials-section relative z-10 bg-[var(--color-pb-surface)] px-6 py-6"
      aria-labelledby="materials-heading"
    >
      <div ref={revealRef} className="reveal-section mx-auto max-w-3xl text-center">
        <span className="section-kicker-light">{materials.label}</span>
        <h2
          id="materials-heading"
          className="mt-6 font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-pb-accent-blue)] sm:text-4xl md:text-5xl"
        >
          {materials.headline.before}{' '}
          <span className="text-[var(--color-pb-accent-blue)]">{materials.headline.accent}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-pb-ink-2)] sm:text-lg">
          {materials.subheadline}
        </p>

        <MaterialsVideoCarousel videos={materials.videos} />
      </div>
    </section>
  );
}
