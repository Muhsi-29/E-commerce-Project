import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { api } from '../api.ts';
import { imageUrl } from '../config.ts';
import type { HomeBanner } from '../types.ts';
import './HeroCarousel.css';

const AUTOPLAY_MS = 5000;
const RESUME_AFTER_MS = 8000; // After the shopper swipes or uses the arrows, wait before moving again

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Distance from one slide to the next: slide width plus the gap
const stepOf = (track: HTMLElement) => {
  const slide = track.firstElementChild as HTMLElement | null;
  return slide ? slide.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0) : 0;
};

// A banner button: a store page, or a link to another site in a new tab
function BannerButton({ banner, focusable }: { banner: HomeBanner; focusable: boolean }) {
  const content = <>{banner.ctaLabel} <ArrowRight size={18} /></>;
  const tabIndex = focusable ? 0 : -1;
  return banner.ctaLink.startsWith('/')
    ? <Link to={banner.ctaLink} className="hero-cta" tabIndex={tabIndex}>{content}</Link>
    : <a href={banner.ctaLink} className="hero-cta" tabIndex={tabIndex} target="_blank" rel="noopener noreferrer">{content}</a>;
}

// The picture side of a slide: the banner's own picture, or popular products from the page it links to
function BannerArt({ banner, eager }: { banner: HomeBanner; eager: boolean }) {
  if (banner.layout === 'COVER') return null;
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="hero-blob" />
      {banner.image
        ? <img src={imageUrl(banner.image)} alt="" className="hero-photo" loading={eager ? 'eager' : 'lazy'} />
        : banner.products.map((product, n) => (
          <img key={product.id} src={imageUrl(product.image)} alt="" className={`hero-img hero-img-${n}`} loading={eager ? 'eager' : 'lazy'} />
        ))}
    </div>
  );
}

// The homepage banner, managed by admins: big rounded slides with the next one peeking in, arrows, dots and autoplay
export default function HeroCarousel() {
  const [banners, setBanners] = useState<HomeBanner[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0); // The same, readable from the autoplay timer
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(prefersReducedMotion);
  const count = banners?.length ?? 0;

  useEffect(() => {
    let alive = true;
    api.get('/banners')
      .then(res => { if (alive) setBanners(res.data.data); })
      .catch(() => { if (alive) setBanners([]); }); // No banner is better than a broken one
    return () => { alive = false; };
  }, []);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track || count === 0) return;
    const wrapped = (index + count) % count;
    track.scrollTo({ left: wrapped * stepOf(track), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [count]);

  // Which slide is showing, from the scroll position (so swiping updates the dots too)
  const onScroll = () => {
    const track = trackRef.current;
    const step = track ? stepOf(track) : 0;
    if (!track || !step) return;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    activeRef.current = atEnd ? count - 1 : Math.round(track.scrollLeft / step);
    setActive(activeRef.current);
  };

  const playing = !stopped && !hovered && count > 1;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (document.hidden || Date.now() < pausedUntil.current) return;
      goTo(activeRef.current + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [playing, goTo]);

  const hold = () => { pausedUntil.current = Date.now() + RESUME_AFTER_MS; };
  const manual = (index: number) => { hold(); goTo(index); };
  const leaveFocus = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false);
  };

  // While loading, hold the space so the page doesn't jump; with no banners, show nothing
  if (banners === null) return <div className="hero-carousel"><div className="hero-skeleton" aria-hidden="true" /></div>;
  if (count === 0) return null;

  return (
    <section
      className={`hero-carousel ${count === 1 ? 'is-single' : ''}`}
      aria-roledescription="carousel"
      aria-label="Featured offers"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={leaveFocus}
    >
      <div
        ref={trackRef}
        className="hero-track"
        onScroll={onScroll}
        onPointerDown={hold}
        onWheel={hold}
        onTouchStart={hold}
      >
        {banners.map((banner, i) => (
          <article
            key={banner.id}
            className={`hero-slide hero-${banner.theme.toLowerCase()} ${banner.layout === 'COVER' ? 'hero-cover' : ''}`}
            style={banner.layout === 'COVER' && banner.image ? { backgroundImage: `url("${imageUrl(banner.image)}")` } : undefined}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${banner.title}`}
          >
            <div className="hero-copy">
              {banner.eyebrow && <span className="hero-eyebrow">{banner.eyebrow}</span>}
              <h2 className="hero-heading">{banner.title}</h2>
              {banner.subtitle && <p className="hero-text">{banner.subtitle}</p>}
              <BannerButton banner={banner} focusable={i === active} />
            </div>
            <BannerArt banner={banner} eager={i === 0} />
          </article>
        ))}
      </div>

      {count > 1 && (
        <div className="hero-controls">
          <div className="hero-dots" role="group" aria-label="Choose a slide">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                className={`hero-dot ${i === active ? 'active' : ''}`}
                onClick={() => manual(i)}
                aria-label={`Show slide ${i + 1}: ${banner.title}`}
                aria-current={i === active ? 'true' : undefined}
              />
            ))}
          </div>
          <div className="hero-buttons">
            <button
              type="button" className="hero-btn" onClick={() => setStopped(s => !s)}
              aria-label={stopped ? 'Play the banner slideshow' : 'Pause the banner slideshow'} title={stopped ? 'Play' : 'Pause'}
            >
              {stopped ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button type="button" className="hero-btn" onClick={() => manual(active - 1)} aria-label="Previous slide">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="hero-btn" onClick={() => manual(active + 1)} aria-label="Next slide">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
