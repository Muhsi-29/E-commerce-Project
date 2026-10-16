import { useState, type MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/wishlist.ts';

// Heart toggle to save a product to the wishlist (guests are sent to log in)
export default function WishlistButton({ productId, withLabel = false }: { productId: number; withLabel?: boolean }) {
  const { has, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);
  const saved = has(productId);

  const onClick = async (e: MouseEvent) => {
    e.preventDefault(); // Cards are links: don't open the product
    e.stopPropagation();
    setBusy(true);
    try {
      await toggle(productId);
    } catch {
      // Network problem: the heart simply stays as it was
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-btn ${saved ? 'saved' : ''} ${withLabel ? 'with-label' : ''}`}
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
    >
      <Heart size={withLabel ? 18 : 17} fill={saved ? 'currentColor' : 'none'} />
      {withLabel && <span>{saved ? 'Saved' : 'Wishlist'}</span>}
    </button>
  );
}
