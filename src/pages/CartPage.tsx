import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Bookmark, Tag, Truck } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { useAuth } from '../context/auth.ts';
import { useCart } from '../context/cart.ts';
import { useStoreConfig } from '../context/storeConfig.ts';
import type { CartItem, Coupon } from '../types.ts';
import { formatPrice } from '../utils/format.ts';
import { getSavedCoupon, saveCoupon } from '../utils/coupon.ts';
import ProductImage from '../components/ProductImage.tsx';
import PageState from '../components/PageState.tsx';
import PriceTag from '../components/PriceTag.tsx';
import QuantityStepper from '../components/QuantityStepper.tsx';
import './CartPage.css';

interface AppliedCoupon {
  code: string;
  description: string;
  discount: number;
}

export default function CartPage() {
  const { user } = useAuth();
  const { items, savedItems, count, subtotal, deliveryFee, loading, updateQuantity, removeItem, saveForLater } = useCart();
  const config = useStoreConfig();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [offers, setOffers] = useState<Coupon[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const appliedCode = useRef(getSavedCoupon()); // The code to re-check when the cart changes

  useEffect(() => {
    api.get('/coupons').then(res => setOffers(res.data.data)).catch(() => {});
  }, [user]);

  // Re-check the applied coupon whenever the cart changes (the discount depends on the total)
  const itemCount = items.length;
  useEffect(() => {
    const code = appliedCode.current;
    if (!user || !code || itemCount === 0) return;
    api.post('/coupons/validate', { code })
      .then(res => { setCoupon(res.data.data); setCouponError(''); })
      .catch(err => {
        appliedCode.current = '';
        setCoupon(null);
        saveCoupon('');
        setCouponError(getErrorMessage(err));
      });
  }, [user, subtotal, itemCount]);

  const run = async (productId: number, action: () => Promise<void>) => {
    setError('');
    setBusyId(productId);
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const applyCoupon = async (code: string) => {
    setCouponError('');
    try {
      const res = await api.post('/coupons/validate', { code });
      setCoupon(res.data.data);
      appliedCode.current = res.data.data.code;
      saveCoupon(res.data.data.code);
      setCouponInput('');
    } catch (err) {
      setCouponError(getErrorMessage(err));
    }
  };

  const removeCoupon = () => {
    appliedCode.current = '';
    setCoupon(null);
    saveCoupon('');
  };

  // Items that can't be ordered as they are (taken off sale, sold out, or stock dropped)
  const problem = (item: CartItem) =>
    item.available === false ? (item.product.stock === 0 ? 'Out of stock' : 'No longer available')
      : item.quantity > item.product.stock ? `Only ${item.product.stock} left: lower the quantity`
        : '';
  const blocked = items.some(item => problem(item));
  const discount = coupon?.discount ?? 0;
  const total = subtotal - discount + deliveryFee;
  const toFreeDelivery = config.delivery.freeThreshold - subtotal;

  const checkout = () => navigate(user ? '/checkout' : '/auth?redirect=%2Fcheckout');

  if (loading && items.length === 0) return <PageState loading />;

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <PageState
        icon={<ShoppingCart size={56} strokeWidth={1.5} />}
        title="Your cart is empty"
        message="Find something you love and add it here."
        action={<Link to="/products" className="btn btn-primary btn-inline">Start shopping</Link>}
      />
    );
  }

  const renderItem = (item: CartItem, saved: boolean) => {
    const issue = saved ? '' : problem(item);
    return (
      <li key={item.productId} className={`cart-item ${item.available === false ? 'unavailable' : ''}`}>
        <Link to={`/products/${item.productId}`} className="cart-item-image">
          <ProductImage product={item.product} />
        </Link>
        <div className="cart-item-info">
          <Link to={`/products/${item.productId}`} className="cart-item-title">{item.product.title}</Link>
          {item.product.sellerName && <span className="cart-item-seller">Sold by {item.product.sellerName}</span>}
          <PriceTag price={item.product.price} mrp={item.product.mrp} />
          {issue && <span className="stock stock-out">{issue}</span>}
          <div className="cart-item-actions">
            {!saved && item.available !== false && (
              <QuantityStepper
                value={item.quantity}
                max={Math.max(item.quantity, Math.min(item.product.stock, 100))}
                disabled={busyId === item.productId}
                onChange={q => run(item.productId, () => updateQuantity(item.productId, q))}
              />
            )}
            {user && (
              <button
                className="btn-link cart-action"
                disabled={busyId === item.productId}
                onClick={() => run(item.productId, () => saveForLater(item.productId, !saved))}
              >
                <Bookmark size={15} /> {saved ? 'Move to cart' : 'Save for later'}
              </button>
            )}
            <button
              className="btn-link cart-action cart-remove"
              onClick={() => run(item.productId, () => removeItem(item.productId))}
              disabled={busyId === item.productId}
            >
              <Trash2 size={15} /> Remove
            </button>
          </div>
        </div>
        {!saved && <div className="cart-item-total">{formatPrice(item.product.price * item.quantity)}</div>}
      </li>
    );
  };

  const submitCoupon = (e: FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) applyCoupon(couponInput.trim());
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Shopping cart</h1>
        <p>{count} {count === 1 ? 'item' : 'items'}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-layout">
        <div className="cart-main">
          {items.length > 0 ? (
            <ul className="cart-items card">{items.map(item => renderItem(item, false))}</ul>
          ) : (
            <div className="card cart-empty-note">Nothing in your cart right now. Move a saved item back, or keep shopping.</div>
          )}

          {savedItems.length > 0 && (
            <section className="saved-section">
              <h2>Saved for later ({savedItems.length})</h2>
              <ul className="cart-items card">{savedItems.map(item => renderItem(item, true))}</ul>
            </section>
          )}
        </div>

        {items.length > 0 && (
          <aside className="cart-summary card">
            <h2>Order summary</h2>
            {toFreeDelivery > 0 ? (
              <p className="free-delivery-hint"><Truck size={16} /> Add {formatPrice(toFreeDelivery)} more for free delivery</p>
            ) : (
              <p className="free-delivery-hint ok"><Truck size={16} /> Your order qualifies for free delivery</p>
            )}
            <div className="summary-row"><span>Items ({count})</span><span>{formatPrice(subtotal)}</span></div>
            {discount > 0 && (
              <div className="summary-row discount"><span>Coupon {coupon!.code}</span><span>-{formatPrice(discount)}</span></div>
            )}
            <div className="summary-row"><span>Delivery</span>{deliveryFee > 0 ? <span>{formatPrice(deliveryFee)}</span> : <span className="free">Free</span>}</div>
            <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>

            <div className="coupon-box">
              {coupon ? (
                <div className="coupon-applied">
                  <Tag size={16} />
                  <div><strong>{coupon.code}</strong><span>{coupon.description}</span></div>
                  <button className="btn-link" onClick={removeCoupon}>Remove</button>
                </div>
              ) : user ? (
                <form className="coupon-form" onSubmit={submitCoupon}>
                  <input className="input-field" placeholder="Coupon code" value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())} aria-label="Coupon code" />
                  <button type="submit" className="btn btn-outline btn-sm btn-inline">Apply</button>
                </form>
              ) : (
                <p className="muted small"><Link to="/auth?redirect=%2Fcart">Log in</Link> to use coupons.</p>
              )}
              {couponError && <p className="field-error">{couponError}</p>}
              {!coupon && offers.length > 0 && (
                <ul className="offer-list">
                  {offers.map(offer => (
                    <li key={offer.code}>
                      <span className="offer-code">{offer.code}</span>
                      <span className="offer-text">{offer.description}</span>
                      {user && <button className="btn-link" onClick={() => applyCoupon(offer.code)}>Apply</button>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {blocked && <div className="alert alert-error">Some items can't be ordered as they are. Update or remove them first.</div>}
            <button className="btn btn-primary" onClick={checkout} disabled={blocked}>
              {user ? 'Proceed to checkout' : 'Log in to check out'} <ArrowRight size={18} />
            </button>
            <Link to="/products" className="continue-link">Continue shopping</Link>
          </aside>
        )}
      </div>
    </div>
  );
}
