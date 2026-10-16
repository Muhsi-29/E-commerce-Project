import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, PackageX, ShoppingCart, Store, Zap } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { useCart } from '../context/cart.ts';
import type { Product, ProductDetail } from '../types.ts';
import { addRecentlyViewed } from '../utils/recentlyViewed.ts';
import ProductGallery from '../components/ProductGallery.tsx';
import ProductRow, { RecentlyViewed } from '../components/ProductRow.tsx';
import PageState from '../components/PageState.tsx';
import PriceTag from '../components/PriceTag.tsx';
import QuantityStepper from '../components/QuantityStepper.tsx';
import StarRating from '../components/StarRating.tsx';
import WishlistButton from '../components/WishlistButton.tsx';
import DeliveryEstimate from '../components/DeliveryEstimate.tsx';
import ReviewsSection from '../components/ReviewsSection.tsx';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<{ boughtTogether: Product[]; similar: Product[] }>({ boughtTogether: [], similar: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const loadProduct = useCallback(async () => {
    const res = await api.get(`/products/${id}`);
    setProduct(res.data.data);
    return res.data.data as ProductDetail;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setMessage(null);
    setQuantity(1);
    loadProduct()
      .then(async loaded => {
        if (cancelled) return;
        addRecentlyViewed(loaded);
        const res = await api.get(`/products/${loaded.id}/related`);
        if (!cancelled) setRelated(res.data.data);
      })
      .catch(err => { if (!cancelled) setError(getErrorMessage(err, 'Product not found.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadProduct]);

  if (loading && !product) return <PageState loading />;
  if (error || !product) {
    return (
      <PageState
        icon={<PackageX size={48} />}
        title="Product not found"
        message={error}
        action={<Link to="/products" className="btn btn-primary btn-inline">Browse products</Link>}
      />
    );
  }

  const inCart = items.find(item => item.productId === product.id)?.quantity ?? 0;
  const maxAddable = Math.max(0, Math.min(product.stock, 100) - inCart);

  const add = async (thenCheckout: boolean) => {
    setMessage(null);
    setAdding(true);
    try {
      await addItem(product, quantity);
      if (thenCheckout) {
        navigate('/cart');
        return;
      }
      setMessage({ type: 'success', text: `Added ${quantity} to your cart.` });
      setQuantity(1);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/products">Products</Link>
        <ChevronRight size={14} />
        <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <ChevronRight size={14} />
        <span>{product.title}</span>
      </nav>

      <div className="product-detail">
        <ProductGallery key={product.id} product={product} />

        <div className="product-detail-info">
          {product.brand && (
            <Link to={`/products?brand=${encodeURIComponent(product.brand)}`} className="product-brand">{product.brand}</Link>
          )}
          <h1>{product.title}</h1>
          {product.ratingCount > 0 && (
            <a href="#reviews" className="rating-link">
              <StarRating value={product.ratingAvg} size={16} />
              <span>{product.ratingAvg.toFixed(1)} · {product.ratingCount} {product.ratingCount === 1 ? 'rating' : 'ratings'}</span>
            </a>
          )}
          <PriceTag price={product.price} mrp={product.mrp} size="lg" />
          <span className="tax-note">Inclusive of all taxes</span>

          {product.stock === 0
            ? <span className="stock stock-out">Out of stock</span>
            : product.stock <= 5
              ? <span className="stock stock-low">Only {product.stock} left, order soon</span>
              : <span className="stock stock-in">In stock</span>}

          <p className="product-detail-description">{product.description}</p>

          <div className="buy-box card">
            {product.stock > 0 && (maxAddable > 0 ? (
              <>
                <div className="buy-box-row">
                  <span>Quantity</span>
                  <QuantityStepper value={quantity} max={maxAddable} onChange={setQuantity} disabled={adding} />
                </div>
                <div className="buy-box-actions">
                  <button className="btn btn-accent" onClick={() => add(false)} disabled={adding}>
                    <ShoppingCart size={18} /> Add to cart
                  </button>
                  <button className="btn btn-primary" onClick={() => add(true)} disabled={adding}>
                    <Zap size={18} /> Buy now
                  </button>
                </div>
              </>
            ) : (
              <p className="buy-box-note">You already have all available stock in your cart.</p>
            ))}
            {inCart > 0 && <p className="buy-box-note">{inCart} already in your <Link to="/cart">cart</Link>.</p>}
            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
            <WishlistButton productId={product.id} withLabel />
            <DeliveryEstimate productId={product.id} />
          </div>

          <div className="seller-box">
            <Store size={18} />
            <div>
              <span className="muted small">Sold by</span>
              {product.seller ? (
                <Link to={`/store/${product.seller.slug}`} className="seller-name">{product.seller.storeName}</Link>
              ) : (
                <strong className="seller-name">{product.sellerName}</strong>
              )}
              {product.sellerRating && product.sellerRating.count > 0 && (
                <span className="seller-rating">
                  <StarRating value={product.sellerRating.average} size={12} /> {product.sellerRating.average.toFixed(1)} seller rating
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {product.specs && product.specs.length > 0 && (
        <section className="specs">
          <h2>Specifications</h2>
          <table className="specs-table">
            <tbody>
              {product.specs.map(spec => (
                <tr key={spec.label}><th>{spec.label}</th><td>{spec.value}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <ProductRow title="Frequently bought together" products={related.boughtTogether} />
      <ReviewsSection productId={product.id} onRatingChange={() => { loadProduct().catch(() => {}); }} />
      <ProductRow title={`More in ${product.category}`} products={related.similar} />
      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}
