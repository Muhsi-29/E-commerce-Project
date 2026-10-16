import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { Product } from '../types.ts';
import { getRecentlyViewed } from '../utils/recentlyViewed.ts';
import ProductCard from './ProductCard.tsx';

const AUTOPLAY_MS = 3500;       // Time between automatic moves
const RESUME_AFTER_MS = 6000;   // After the shopper scrolls or swipes, wait this long before moving again

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

interface ProductRowProps {
  title: string;
  products: Product[];
  autoPlay?: boolean;  // Slide one card at a time on its own, looping back to the start
  viewAllTo?: string;  // Optional "View all" link
}

// A titled, horizontally scrolling row of product cards with arrow buttons; optionally an automatic slider
export default function ProductRow({ title, products, autoPlay = false, viewAllTo }: ProductRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const [edges, setEdges] = useState({ start: true, end: true });
  const [hovered, setHovered] = useState(false); // Mouse over, or keyboard focus inside
  const [stopped, setStopped] = useState(prefersReducedMotion); // Pause button, or the reduced-motion setting

  // Which ends of the row are visible (to disable arrows, and hide them when nothing overflows)
  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({ start: track.scrollLeft <= 2, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges, products]);

  // Move by one card (autoplay) or one screenful (arrows). At the end, autoplay rewinds to the start.
  const move = useCallback((direction: 1 | -1, amount: 'card' | 'page') => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : track.clientWidth;
    const perPage = Math.max(1, Math.floor((track.clientWidth + gap) / step));
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    if (amount === 'card' && direction === 1 && atEnd) {
      track.scrollTo({ left: 0, behavior });
    } else {
      track.scrollBy({ left: direction * step * (amount === 'card' ? 1 : perPage), behavior });
    }
  }, []);

  const playing = autoPlay && !stopped && !hovered;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (document.hidden || Date.now() < pausedUntil.current) return;
      move(1, 'card');
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [playing, move]);

  const holdAutoplay = () => { pausedUntil.current = Date.now() + RESUME_AFTER_MS; };
  const arrow = (direction: 1 | -1) => { holdAutoplay(); move(direction, 'page'); };
  const leaveFocus = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false);
  };

  if (products.length === 0) return null;
  const overflowing = !(edges.start && edges.end);

  return (
    <section
      className="product-row"
      aria-label={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={leaveFocus}
    >
      <div className="product-row-head">
        <h2>{title}</h2>
        <div className="row-controls">
          {viewAllTo && <Link to={viewAllTo} className="section-link">View all <ArrowRight size={16} /></Link>}
          {overflowing && (
            <>
              {autoPlay && (
                <button
                  type="button" className="row-btn" onClick={() => setStopped(s => !s)}
                  aria-label={stopped ? `Play ${title} slideshow` : `Pause ${title} slideshow`} title={stopped ? 'Play' : 'Pause'}
                >
                  {stopped ? <Play size={16} /> : <Pause size={16} />}
                </button>
              )}
              <button type="button" className="row-btn" onClick={() => arrow(-1)} disabled={edges.start} aria-label={`Previous ${title}`}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="row-btn" onClick={() => arrow(1)} disabled={edges.end} aria-label={`Next ${title}`}>
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>
      <div
        ref={trackRef}
        className="product-row-track"
        onScroll={updateEdges}
        onPointerDown={holdAutoplay}
        onWheel={holdAutoplay}
        onTouchStart={holdAutoplay}
      >
        {products.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

// "Recently viewed", from this browser's history (optionally leaving out the product being viewed)
export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const [products] = useState(getRecentlyViewed);
  return <ProductRow title="Recently viewed" products={products.filter(p => p.id !== excludeId).slice(0, 8)} />;
}
