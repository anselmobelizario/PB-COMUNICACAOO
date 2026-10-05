import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { siteData, assetUrl, assetSrcSet } from '../../data/siteData';
import { getPrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const HERO_VARIANTS = new Set(['a', 'b', 'c']);
const FLAG_WAVE_PATHS = [
  'M0 5.2 C12 5.5 28 3.2 48 2.6 C68 2.1 86 3.2 100 4.4 L100 5.1 C84 4.1 66 3.5 44 4.1 C24 4.7 8 5.3 0 5.2 Z',
  'M0 5.2 C14 4.0 30 6.4 50 3.5 C72 0.8 86 5.6 100 3.2 L100 4.1 C86 6.2 68 2.2 48 4.8 C30 6.8 12 4.4 0 5.2 Z',
  'M0 5.2 C16 6.6 34 2.2 52 5.4 C70 8.0 88 2.6 100 5.4 L100 6.2 C86 3.6 70 7.0 50 4.4 C32 2.0 14 5.8 0 5.2 Z',
  'M0 5.2 C12 3.6 34 5.9 52 2.7 C74 0.2 88 4.9 100 3.0 L100 3.9 C86 5.5 70 1.6 50 4.1 C32 6.5 14 4.2 0 5.2 Z',
  'M0 5.2 C12 5.5 28 3.2 48 2.6 C68 2.1 86 3.2 100 4.4 L100 5.1 C84 4.1 66 3.5 44 4.1 C24 4.7 8 5.3 0 5.2 Z',
];

function wantsPortraitHero() {
  if (typeof window === 'undefined') return false;
  return siteData.hero.video.portraitQueries.some((query) => window.matchMedia(query).matches);
}

function heroClipUrl() {
  const { sources } = siteData.hero.video;
  const portrait = wantsPortraitHero();
  const chosen = sources.find((source) => Boolean(source.media) === portrait) || sources[sources.length - 1];
  return assetUrl(chosen.src);
}

function getHeroVariant() {
  if (typeof window === 'undefined') return 'a';

  const requestedVariant = new URLSearchParams(window.location.search).get('hero');
  return HERO_VARIANTS.has(requestedVariant) ? requestedVariant : 'a';
}

function FlagWaveMark({ children }) {
  return (
    <span className="hero-intro-mark">
      {children}
      <svg
        className="hero-intro-mark-wave"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={FLAG_WAVE_PATHS[0]}>
          <animate
            attributeName="d"
            dur="2.1s"
            repeatCount="indefinite"
            values={FLAG_WAVE_PATHS.join(';')}
            calcMode="spline"
            keyTimes="0;0.25;0.5;0.75;1"
            keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
          />
        </path>
      </svg>
    </span>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const userPausedRef = useRef(false);
  // The URL ?hero= variant is applied after hydration: the server prerenders
  // the default and cannot see the query string.
  const [heroVariant, setHeroVariant] = useState('a');

  const [isReady, setIsReady] = useState(false);
  // Values that depend on browser APIs start at the server-rendered default
  // and sync in an effect, so hydration never sees a mismatch.
  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  // Empty until the browser can be measured. The server cannot know, and
  // <source media> is what handed iPhone the blurred widescreen film.
  const [clipUrl, setClipUrl] = useState('');
  const [portraitClip, setPortraitClip] = useState(false);

  const { video, headline, highlight, intro, subheadline } = siteData.hero;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe sync of client-only values
    setHeroVariant(getHeroVariant());
    if (getPrefersReducedMotion()) setIsPlaybackBlocked(true);
    // Respeita apenas o "Economia de dados" do aparelho; em qualquer tela o
    // vídeo toca.
    if (navigator.connection?.saveData === true) setIsVideoEnabled(false);
  }, []);

  const handleSourceError = () => setIsVideoEnabled(false);

  useLayoutEffect(() => {
    const apply = () => {
      const portrait = wantsPortraitHero();
      setPortraitClip(portrait);
      setClipUrl(heroClipUrl());
    };

    apply();
    const matchers = siteData.hero.video.portraitQueries.map((query) => window.matchMedia(query));
    matchers.forEach((matcher) => matcher.addEventListener('change', apply));
    return () => matchers.forEach((matcher) => matcher.removeEventListener('change', apply));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const media = videoRef.current;

    if (!isVideoEnabled || !section || !media || !clipUrl || getPrefersReducedMotion()) return undefined;

    // The hero is the first screen, so assume it is visible. Waiting for the
    // observer let iOS cancel autoplay on a zero-height first layout pass.
    let isVisible = true;
    let recoveryFrame = 0;

    const cancelRecoveryFrame = () => {
      if (!recoveryFrame) return;
      cancelAnimationFrame(recoveryFrame);
      recoveryFrame = 0;
    };

    const pauseVideo = () => {
      cancelRecoveryFrame();
      media.pause();
    };

    const playVideo = async () => {
      // An explicit keyboard pause wins over every auto-recovery path.
      if (userPausedRef.current || !isVisible || document.hidden) return false;

      media.muted = true;
      media.defaultMuted = true;
      media.playsInline = true;

      try {
        const playback = media.play();
        if (playback && typeof playback.then === 'function') {
          await playback;
        }
        setIsPlaybackBlocked(false);
        return true;
      } catch (error) {
        // A pause that lands mid-play rejects with AbortError. That is not a
        // policy block, and treating it as one is what left the play button up.
        if (error?.name !== 'NotAllowedError' || media.readyState < 2) return false;
        setIsPlaybackBlocked(true);
        return false;
      }
    };

    const queueRecovery = () => {
      if (recoveryFrame || !isVisible || document.hidden || !media.paused) return;

      recoveryFrame = requestAnimationFrame(() => {
        recoveryFrame = 0;
        void playVideo();
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseVideo();
        return;
      }
      queueRecovery();
    };

    const handleAutoplayRecovery = (event) => {
      if (event.target?.closest?.('.hero-video-unblock')) return;
      if (!media.paused) return;
      void playVideo();
    };

    const handleCanPlay = () => {
      setIsReady(true);
      queueRecovery();
    };

    const handleVideoError = () => {
      setIsVideoEnabled(false);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.height === 0) return;

        isVisible = entry.isIntersecting;

        if (isVisible) {
          queueRecovery();
          return;
        }

        pauseVideo();
      },
      { threshold: 0.1 },
    );

    io.observe(section);

    media.addEventListener('loadeddata', handleCanPlay);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('playing', handleCanPlay);
    media.addEventListener('error', handleVideoError);

    if (media.readyState >= 2) {
      handleCanPlay();
    }

    queueRecovery();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleAutoplayRecovery);
    window.addEventListener('touchstart', handleAutoplayRecovery);
    window.addEventListener('keydown', handleAutoplayRecovery);

    return () => {
      io.disconnect();
      media.removeEventListener('loadeddata', handleCanPlay);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('playing', handleCanPlay);
      media.removeEventListener('error', handleVideoError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleAutoplayRecovery);
      window.removeEventListener('touchstart', handleAutoplayRecovery);
      window.removeEventListener('keydown', handleAutoplayRecovery);
      pauseVideo();
    };
  }, [clipUrl, isVideoEnabled]);

  const handleManualPlayback = async () => {
    const media = videoRef.current;
    if (!media) return;

    media.muted = true;
    media.defaultMuted = true;
    media.playsInline = true;
    userPausedRef.current = false;
    setIsUserPaused(false);

    try {
      await media.play();
      setIsReady(true);
      setIsPlaybackBlocked(false);
    } catch {
      setIsPlaybackBlocked(true);
    }
  };

  const toggleHeroPlayback = () => {
    const media = videoRef.current;
    if (!media) return;

    if (media.paused) {
      userPausedRef.current = false;
      setIsUserPaused(false);
      media.muted = true;
      media.defaultMuted = true;
      media.playsInline = true;
      media.play()?.catch?.(() => {});
      return;
    }

    userPausedRef.current = true;
    setIsUserPaused(true);
    media.pause();
  };

  return (
    <section
      ref={sectionRef}
      className={`hero-section hero-variant-${heroVariant}${heroVariant === 'a' ? ' hero-overlay' : ''}`}
      data-hero-variant={heroVariant}
    >
      <div className="hero-shell">
        {isVideoEnabled && !isPlaybackBlocked && (
          <button
            type="button"
            className="hero-video-toggle"
            onClick={toggleHeroPlayback}
          >
            {isUserPaused ? 'Reproduzir vídeo' : 'Pausar vídeo'}
          </button>
        )}

        <div className="hero-media-frame">
          <div className="hero-media-visual" aria-hidden="true">
            {portraitClip ? (
              <img
                src={assetUrl(video.posterPortrait)}
                alt=""
                className="hero-poster"
                width={480}
                height={768}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable="false"
              />
            ) : (
              <picture>
                {video.portraitQueries.map((query) => (
                  <source key={query} media={query} srcSet={assetUrl(video.posterPortrait)} />
                ))}
                <img
                  src={assetUrl(video.poster)}
                  srcSet={assetSrcSet(video.posterSrcSet)}
                  sizes="100vw"
                  alt=""
                  className="hero-poster"
                  width={1920}
                  height={1080}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  draggable="false"
                />
              </picture>
            )}

            {isVideoEnabled && (
              <video
                ref={(node) => {
                  videoRef.current = node;
                  if (!node) return;
                  // The attribute alone is not enough: several engines check the
                  // property, and a truthy property is what lets autoplay through.
                  node.muted = true;
                  node.defaultMuted = true;
                  node.playsInline = true;
                  // Assign the file here. <source media> is ignored by iOS, so the
                  // browser would otherwise keep the blurred widescreen film.
                  const url = heroClipUrl();
                  if (url && node.src !== new URL(url, window.location.href).href) node.src = url;
                }}
                className={`hero-video ${isReady ? 'is-ready' : ''}`}
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                preload={clipUrl ? 'auto' : 'none'}
                src={clipUrl || undefined}
                onError={handleSourceError}
                // No poster attr: the twin <img> behind it shows the same
                // frame, and a video poster only turns into a (late) LCP
                // candidate the moment the faded-out video becomes ready.
                width={1920}
                height={1080}
                tabIndex={-1}
              />
            )}
          </div>

          {isVideoEnabled && isPlaybackBlocked && (
            <button
              type="button"
              className="hero-video-unblock inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              onClick={handleManualPlayback}
            >
              <Play size={14} fill="currentColor" strokeWidth={1.75} aria-hidden="true" />
              Reproduzir vídeo
            </button>
          )}
        </div>

        <div className="hero-scrim" aria-hidden="true" />

        <div className="hero-copy">
          <img
            className="hero-brand-logo"
            src={assetUrl('/assets/logo-original.webp')}
            srcSet={assetSrcSet('/assets/logo-original-240.webp 240w, /assets/logo-original-360.webp 360w, /assets/logo-original.webp 480w')}
            sizes="min(11.5rem, 48%)"
            alt="P&B Comunicação Visual"
            width={480}
            height={362}
          />

          <h1 className="hero-title fade-in-up-delay-1">
            {headline}
            <br />
            <span className="hero-title-accent">{highlight}</span>
          </h1>

          <p className="hero-intro fade-in-up-delay-2">
            <FlagWaveMark>{intro.mark}</FlagWaveMark>
            {' '}
            {intro.text}
          </p>
          <div className="hero-description fade-in-up-delay-2">
            {subheadline.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
