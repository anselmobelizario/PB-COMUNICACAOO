import { useEffect, useRef, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
// Stage swap runs on a 720ms CSS animation; if its animationend never fires
// (tab hidden mid-flight, animation canceled) the controls would stay locked.
const LEAF_TRANSITION_FALLBACK_MS = 1200;

function getReducedMotionPreference() {
  return typeof window !== 'undefined'
    && window.matchMedia?.(REDUCED_MOTION_QUERY).matches;
}

function VideoSlide({
  video,
  mode,
  direction,
  isInView,
  shouldPlay,
  onEnded,
  onError,
  onPlaybackBlocked,
  onAnimationEnd,
}) {
  const mediaRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isVisible = mode === 'active' || mode === 'entering';
  const isPlayable = mode === 'active' || mode === 'entering';

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return undefined;

    media.muted = true;

    if (isPlayable && isInView && shouldPlay && !hasError) {
      if (media.ended) media.currentTime = 0;
      const playback = media.play();
      playback?.catch?.((error) => {
        // iOS Low Power Mode and the like reject even muted autoplay; without
        // this the toggle keeps claiming the carousel is playing.
        if (error?.name === 'NotAllowedError') onPlaybackBlocked?.();
      });
    } else {
      media.pause();
    }

    return undefined;
  }, [hasError, isInView, isPlayable, onPlaybackBlocked, shouldPlay, video.src]);

  return (
    <div
      className={`portfolio-video-carousel-slide is-${mode}`}
      role="group"
      aria-roledescription="slide"
      aria-label={video.alt}
      aria-hidden={!isVisible}
      data-direction={direction}
      onAnimationEnd={onAnimationEnd}
    >
      <img
        className={isReady ? 'is-hidden' : ''}
        src={video.poster}
        alt={isVisible ? video.alt : ''}
        width={1280}
        height={720}
        loading={mode === 'active' && isInView ? 'eager' : 'lazy'}
        decoding="async"
      />
      {!hasError && (
        <video
          ref={mediaRef}
          className={isReady ? 'is-ready' : ''}
          autoPlay={isPlayable && isInView && shouldPlay}
          muted
          playsInline
          preload={isPlayable && isInView && shouldPlay ? 'auto' : 'none'}
          // No poster: the lazy <img> above already shows one, and a poster
          // attr fetched every slide's image on page load.
          onPlaying={() => setIsReady(true)}
          onEnded={onEnded}
        >
          <source
            src={video.src}
            type="video/mp4"
            onError={() => {
              setHasError(true);
              setIsReady(false);
              onError?.();
            }}
          />
          Seu navegador não consegue reproduzir este vídeo.
        </video>
      )}
    </div>
  );
}

export default function PortfolioVideoCarousel({ videos }) {
  const carouselRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState(null);
  const [isInView, setIsInView] = useState(() => typeof IntersectionObserver === 'undefined');
  const [isReducedMotion, setIsReducedMotion] = useState(getReducedMotionPreference);
  const [isAutoPlaying, setIsAutoPlaying] = useState(() => !getReducedMotionPreference());
  const [isPlaybackEnabled, setIsPlaybackEnabled] = useState(() => !getReducedMotionPreference());

  const videoCount = videos.length;
  const activeVideo = videos[activeIndex];
  const nextIndex = videoCount > 1 ? (activeIndex + 1) % videoCount : null;
  const nextVideo = nextIndex === null ? null : videos[nextIndex];
  const incomingVideo = transition ? videos[transition.to] : null;

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '180px 0px' },
    );

    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!media) return undefined;

    const handlePreferenceChange = (event) => {
      setIsReducedMotion(event.matches);
      if (event.matches) {
        setIsAutoPlaying(false);
        setIsPlaybackEnabled(false);
      }
    };

    media.addEventListener?.('change', handlePreferenceChange);
    return () => media.removeEventListener?.('change', handlePreferenceChange);
  }, []);

  useEffect(() => {
    if (!transition) return undefined;
    const fallback = setTimeout(() => {
      setActiveIndex(transition.to);
      setTransition(null);
    }, LEAF_TRANSITION_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [transition]);

  if (!activeVideo) return null;

  const suspendAutoRotation = () => setIsAutoPlaying(false);

  const completeTransition = () => {
    if (!transition) return;
    setActiveIndex(transition.to);
    setTransition(null);
  };

  const moveTo = (targetIndex, direction) => {
    if (
      videoCount < 2
      || transition
      || targetIndex === activeIndex
      || targetIndex < 0
      || targetIndex >= videoCount
    ) return;

    if (isReducedMotion) {
      setActiveIndex(targetIndex);
      return;
    }

    setTransition({ to: targetIndex, direction });
  };

  const goToNext = () => moveTo((activeIndex + 1) % videoCount, 'next');
  const goToPrevious = () => moveTo((activeIndex - 1 + videoCount) % videoCount, 'previous');

  const handleVideoEnded = () => {
    if (isAutoPlaying && !isReducedMotion) {
      goToNext();
      return;
    }
    setIsPlaybackEnabled(false);
  };

  const togglePlayback = () => {
    setIsPlaybackEnabled((current) => {
      const nextPlaybackState = !current;
      setIsAutoPlaying(nextPlaybackState && !isReducedMotion);
      return nextPlaybackState;
    });
  };

  const handleIncomingAnimationEnd = (event) => {
    if (
      event.animationName === 'portfolio-video-leaf-in'
      || event.animationName === 'portfolio-video-leaf-in-reverse'
    ) {
      completeTransition();
    }
  };

  return (
    <div
      ref={carouselRef}
      className="portfolio-video-carousel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Showreel de bastidores"
      onMouseEnter={suspendAutoRotation}
      onFocusCapture={suspendAutoRotation}
    >
      <div className="portfolio-video-carousel-stage">
        {transition ? (
          <>
            <VideoSlide
              key={activeVideo.id}
              video={activeVideo}
              mode="leaving"
              direction={transition.direction}
              isInView={isInView}
              shouldPlay={false}
            />
            <VideoSlide
              key={incomingVideo.id}
              video={incomingVideo}
              mode="entering"
              direction={transition.direction}
              isInView={isInView}
              shouldPlay={isPlaybackEnabled}
              onEnded={handleVideoEnded}
              onError={() => setIsPlaybackEnabled(false)}
              onPlaybackBlocked={() => setIsPlaybackEnabled(false)}
              onAnimationEnd={handleIncomingAnimationEnd}
            />
          </>
        ) : (
          <>
            <VideoSlide
              key={activeVideo.id}
              video={activeVideo}
              mode="active"
              isInView={isInView}
              shouldPlay={isPlaybackEnabled}
              onEnded={handleVideoEnded}
              onError={() => setIsPlaybackEnabled(false)}
              onPlaybackBlocked={() => setIsPlaybackEnabled(false)}
            />
            {nextVideo && (
              <VideoSlide
                key={nextVideo.id}
                video={nextVideo}
                mode="preloaded"
                isInView={isInView}
                shouldPlay={false}
              />
            )}
          </>
        )}
      </div>

      <div className="portfolio-video-carousel-info">
        <div
          className="portfolio-video-carousel-controls"
          role="group"
          aria-label="Controles do showreel"
        >
          <button
            type="button"
            className="portfolio-video-carousel-control"
            onClick={goToPrevious}
            aria-label="Vídeo anterior"
            disabled={videoCount < 2 || Boolean(transition)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className="portfolio-video-carousel-control is-primary"
            onClick={togglePlayback}
            aria-label={isPlaybackEnabled ? 'Pausar showreel' : 'Reproduzir showreel'}
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
          <button
            type="button"
            className="portfolio-video-carousel-control"
            onClick={goToNext}
            aria-label="Próximo vídeo"
            disabled={videoCount < 2 || Boolean(transition)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="portfolio-video-carousel-progress">
        <div className="portfolio-video-carousel-dots" role="group" aria-label="Selecionar vídeo">
          {videos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              className={`portfolio-video-carousel-dot ${index === activeIndex ? 'is-active' : ''}`}
              onClick={() => moveTo(index, index > activeIndex ? 'next' : 'previous')}
              aria-label={`Mostrar vídeo ${index + 1} de ${videoCount}`}
              aria-pressed={index === activeIndex}
              disabled={Boolean(transition)}
            />
          ))}
        </div>
        <span className="portfolio-video-carousel-counter" aria-live={isAutoPlaying ? 'off' : 'polite'}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(videoCount).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
