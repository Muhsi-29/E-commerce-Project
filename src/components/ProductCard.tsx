import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShoppingCart } from 'lucide-react';
import { getErrorMessage } from '../api.ts';
import { useCart } from '../context/cart.ts';
import type { Product } from '../types.ts';
import ProductImage from './ProductImage.tsx';
import PriceTag from './PriceTag.tsx';
import StarRating from './StarRating.tsx';
import WishlistButton from './WishlistButton.tsx';
import './ProductCard.css';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setError('');
    setState('adding');
    try {
      await addItem(product);
      setState('added');
      setTimeout(() => setState('idle'), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
      setState('idle');
    }
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-card-image">
          <ProductImage product={product} />
          {product.discountPercent > 0 && <span className="discount-badge">{product.discountPercent}% off</span>}
          <span className="card-wishlist"><WishlistButton productId={product.id} /></span>
        </div>
        <div className="product-card-body">
          <span className="product-card-category">{product.brand ?? product.category}</span>
          <h3 className="product-card-title">{product.title}</h3>
          {product.ratingCount > 0 && <StarRating value={product.ratingAvg} count={product.ratingCount} size={13} />}
          <PriceTag price={product.price} mrp={product.mrp} />
          {product.stock === 0
            ? <span className="stock stock-out">Out of stock</span>
            : product.stock <= 5
              ? <span className="stock stock-low">Only {product.stock} left</span>
              : <span className="stock stock-in">In stock</span>}
        </div>
      </Link>
      <div className="product-card-footer">
        <button
          className="btn btn-accent btn-sm"
          onClick={handleAdd}
          disabled={product.stock === 0 || state === 'adding'}
        >
          {state === 'added' ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> Add to cart</>}
        </button>
        {error && <p className="product-card-error">{error}</p>}
      </div>
    </article>
  );
}
