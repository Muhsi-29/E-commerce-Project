import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { useCart } from '../context/cart.ts';
import { useWishlist } from '../context/wishlist.ts';
import type { Product } from '../types.ts';
import ProductImage from '../components/ProductImage.tsx';
import PageState from '../components/PageState.tsx';
import PriceTag from '../components/PriceTag.tsx';
import './AccountPages.css';

interface WishlistEntry {
  productId: number;
  available: boolean;
  product: Product;
}

export default function WishlistPage() {
  const { toggle } = useWishlist();
  const { addItem } = useCart();
  const [items, setItems] = useState<WishlistEntry[] | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get('/wishlist').then(res => setItems(res.data.data)).catch(err => setMessage({ type: 'error', text: getErrorMessage(err) }));
  }, []);

  const remove = async (productId: number) => {
    await toggle(productId).catch(() => {});
    setItems(current => current?.filter(item => item.productId !== productId) ?? null);
  };

  const moveToCart = async (entry: WishlistEntry) => {
    try {
      await addItem(entry.product);
      await remove(entry.productId);
      setMessage({ type: 'success', text: `"${entry.product.title}" moved to your cart.` });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  };

  if (!items && !message) return <PageState loading />;
  if (items && items.length === 0) {
    return (
      <PageState
        icon={<Heart size={56} strokeWidth={1.5} />}
        title="Your wishlist is empty"
        message="Tap the heart on any product to save it for later."
        action={<Link to="/products" className="btn btn-primary btn-inline">Discover products</Link>}
      />
    );
  }

  return (
    <div className="container account-page">
      <div className="page-header">
        <h1>Your wishlist</h1>
        {items && <p>{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>}
      </div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <ul className="wishlist-grid">
        {items?.map(entry => (
          <li key={entry.productId} className="card wishlist-item">
            <Link to={`/products/${entry.productId}`} className="wishlist-image"><ProductImage product={entry.product} /></Link>
            <div className="wishlist-body">
              <Link to={`/products/${entry.productId}`} className="wishlist-title">{entry.product.title}</Link>
              <PriceTag price={entry.product.price} mrp={entry.product.mrp} />
              {!entry.available
                ? <span className="stock stock-out">No longer available</span>
                : entry.product.stock === 0 && <span className="stock stock-out">Out of stock</span>}
              <div className="wishlist-actions">
                <button className="btn btn-accent btn-sm" disabled={!entry.available || entry.product.stock === 0} onClick={() => moveToCart(entry)}>
                  <ShoppingCart size={15} /> Move to cart
                </button>
                <button className="btn-link danger-link" onClick={() => remove(entry.productId)}><Trash2 size={14} /> Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
