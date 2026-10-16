import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Banknote, Lock, Smartphone, Plus, Tag } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../api.ts';
import { useAuth } from '../context/auth.ts';
import { useCart } from '../context/cart.ts';
import { useStoreConfig } from '../context/storeConfig.ts';
import type { Address, DeliveryEstimate, PaymentMethod, ShippingAddress } from '../types.ts';
import { emptyAddress, formatAddress } from '../utils/address.ts';
import { getSavedCoupon, saveCoupon } from '../utils/coupon.ts';
import { formatPrice } from '../utils/format.ts';
import { loadRazorpay } from '../utils/razorpay.ts';
import AddressForm from '../components/AddressForm.tsx';
import PageState from '../components/PageState.tsx';
import './CheckoutPage.css';

const NEW_ADDRESS = 0;

const toShipping = ({ fullName, phone, line1, line2, city, state, postalCode }: Address | ShippingAddress): ShippingAddress =>
  ({ fullName, phone, line1, line2: line2 || undefined, city, state, postalCode });

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, count, subtotal, deliveryFee, refresh } = useCart();
  const config = useStoreConfig();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(NEW_ADDRESS);
  const [newAddress, setNewAddress] = useState<ShippingAddress>(() => emptyAddress(user?.name ?? ''));
  const [saveAddress, setSaveAddress] = useState(true);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);

  const [couponInput, setCouponInput] = useState(getSavedCoupon);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const [chosenMethod, setChosenMethod] = useState<PaymentMethod | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handledCancel = useRef(false);

  // Saved addresses: start with the default one
  useEffect(() => {
    api.get('/addresses')
      .then(res => {
        setAddresses(res.data.data);
        const preferred = res.data.data.find((a: Address) => a.isDefault) ?? res.data.data[0];
        if (preferred) setSelectedAddress(preferred.id);
      })
      .catch(() => setAddresses([]));
  }, []);

  // The coupon carried over from the cart page
  useEffect(() => {
    const saved = getSavedCoupon();
    if (!saved) return;
    api.post('/coupons/validate', { code: saved })
      .then(res => setCoupon(res.data.data))
      .catch(() => saveCoupon(''));
  }, [subtotal]);

  // Coming back from Stripe without paying: cancel that pending order right away so its stock is released.
  // (Your cart still has the items, so you can try again.)
  const cancelledOrderId = searchParams.get('cancelled');
  useEffect(() => {
    if (!cancelledOrderId || handledCancel.current) return;
    handledCancel.current = true;
    api.patch(`/orders/${cancelledOrderId}/cancel`)
      .catch(() => {}) // Already cancelled or paid: nothing to do
      .finally(() => {
        setNotice('Payment cancelled. Nothing was charged, and your items are still in your cart.');
        setSearchParams({}, { replace: true });
        refresh().catch(() => {});
      });
  }, [cancelledOrderId, setSearchParams, refresh]);

  const shippingAddress = selectedAddress === NEW_ADDRESS
    ? newAddress
    : addresses?.find(a => a.id === selectedAddress) ?? newAddress;

  // Estimated delivery date for the chosen PIN code
  const pincode = shippingAddress.postalCode;
  useEffect(() => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setEstimate(null);
      return;
    }
    api.get('/delivery/estimate', { params: { pincode } }).then(res => setEstimate(res.data.data)).catch(() => setEstimate(null));
  }, [pincode]);

  const methods = ([
    config.payments.razorpay && { id: 'RAZORPAY', icon: Smartphone, title: 'UPI, cards & net banking', text: 'Pay securely with Razorpay: Google Pay, PhonePe, Paytm, any UPI app, cards or net banking.' },
    config.payments.stripe && { id: 'STRIPE', icon: CreditCard, title: 'Credit or debit card', text: "You'll be taken to Stripe's secure payment page." },
    config.payments.cod && { id: 'COD', icon: Banknote, title: 'Cash on delivery', text: 'Pay in cash (or UPI) when your order arrives.' },
  ] as const).filter(Boolean) as { id: PaymentMethod; icon: typeof CreditCard; title: string; text: string }[];
  const paymentMethod = chosenMethod && methods.some(m => m.id === chosenMethod) ? chosenMethod : methods[0]?.id ?? 'COD';

  if (items.length === 0 && !submitting) {
    return (
      <PageState
        title="Nothing to check out"
        message={notice || 'Your cart is empty.'}
        action={<Link to="/products" className="btn btn-primary btn-inline">Browse products</Link>}
      />
    );
  }

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponInput.trim()) return;
    try {
      const res = await api.post('/coupons/validate', { code: couponInput.trim() });
      setCoupon(res.data.data);
      saveCoupon(res.data.data.code);
    } catch (err) {
      setCoupon(null);
      setCouponError(getErrorMessage(err));
    }
  };

  const finishOrder = async (orderId: number) => {
    saveCoupon('');
    await refresh().catch(() => {});
    navigate(`/orders?placed=${orderId}`);
  };

  // Razorpay opens its own payment window; we confirm the payment with our backend afterwards
  const payWithRazorpay = async (body: object) => {
    if (!(await loadRazorpay()) || !window.Razorpay) {
      throw new Error("Couldn't load Razorpay. Check your connection, or choose another payment method.");
    }
    const res = await api.post('/orders/razorpay', body);
    const payment = res.data.data;
    const checkout = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: 'Shoyo',
      description: `Order #${payment.orderId}`,
      order_id: payment.razorpayOrderId,
      prefill: payment.customer,
      theme: { color: '#10b981' },
      handler: async (response) => {
        try {
          await api.post('/orders/razorpay/verify', {
            orderId: payment.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          await finishOrder(payment.orderId);
        } catch (err) {
          setError(`${getErrorMessage(err)} If money was taken, your order will update shortly. Check your orders page.`);
          setSubmitting(false);
        }
      },
      modal: {
        // Closed without paying: release the reserved stock
        ondismiss: () => {
          api.patch(`/orders/${payment.orderId}/cancel`).catch(() => {});
          setNotice('Payment cancelled. Nothing was charged, and your items are still in your cart.');
          setSubmitting(false);
        },
      },
    });
    checkout.open();
  };

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      const address = toShipping(shippingAddress);
      if (selectedAddress === NEW_ADDRESS && saveAddress) {
        try {
          await api.post('/addresses', { ...address, isDefault: !addresses?.length });
        } catch (err) {
          setFieldErrors(getFieldErrors(err));
          throw err;
        }
      }

      const body = { shippingAddress: address, couponCode: coupon?.code };
      if (paymentMethod === 'RAZORPAY') {
        await payWithRazorpay(body);
        return; // The Razorpay window takes over from here
      }
      if (paymentMethod === 'STRIPE') {
        const res = await api.post('/orders/checkout', body);
        window.location.href = res.data.url; // Off to Stripe's secure payment page
        return;
      }
      const res = await api.post('/orders', body);
      await finishOrder(res.data.data.id);
    } catch (err) {
      setFieldErrors(current => ({ ...current, ...getFieldErrors(err, 'shippingAddress.') }));
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const discount = coupon?.discount ?? 0;
  const total = subtotal - discount + deliveryFee;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Checkout</h1>
      </div>

      {notice && <div className="alert alert-info">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-main">
          <section className="card checkout-section">
            <h2>1. Delivery address</h2>
            {addresses && addresses.length > 0 && (
              <div className="address-choices">
                {addresses.map(address => (
                  <label key={address.id} className={`address-choice ${selectedAddress === address.id ? 'selected' : ''}`}>
                    <input type="radio" name="address" checked={selectedAddress === address.id} onChange={() => setSelectedAddress(address.id)} />
                    <div>
                      <strong>{address.fullName}</strong> {address.label && <span className="address-label">{address.label}</span>}
                      <span>{formatAddress(address)}</span>
                      <span className="muted small">Phone: {address.phone}</span>
                    </div>
                  </label>
                ))}
                <label className={`address-choice ${selectedAddress === NEW_ADDRESS ? 'selected' : ''}`}>
                  <input type="radio" name="address" checked={selectedAddress === NEW_ADDRESS} onChange={() => setSelectedAddress(NEW_ADDRESS)} />
                  <div><strong><Plus size={14} /> Deliver to a new address</strong></div>
                </label>
              </div>
            )}
            {selectedAddress === NEW_ADDRESS && (
              <>
                <AddressForm value={newAddress} onChange={setNewAddress} errors={fieldErrors} idPrefix="checkout" />
                <label className="remember-me save-address">
                  <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
                  <span>Save this address for next time</span>
                </label>
              </>
            )}
            {estimate && (
              <p className="checkout-estimate">Estimated delivery: <strong>{dayLabel(estimate.earliest)} - {dayLabel(estimate.latest)}</strong></p>
            )}
          </section>

          <section className="card checkout-section">
            <h2>2. Payment</h2>
            {methods.map(method => (
              <label key={method.id} className={`payment-option ${paymentMethod === method.id ? 'selected' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === method.id} onChange={() => setChosenMethod(method.id)} />
                <method.icon size={22} />
                <div>
                  <strong>{method.title}</strong>
                  <span>{method.text}</span>
                </div>
              </label>
            ))}
          </section>
        </div>

        <aside className="card checkout-summary">
          <h2>Order summary</h2>
          <ul className="checkout-items">
            {items.map(item => (
              <li key={item.productId}>
                <span>{item.quantity} × {item.product.title}</span>
                <span>{formatPrice(item.product.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="checkout-coupon">
            <Tag size={16} />
            <input className="input-field" placeholder="Coupon code" aria-label="Coupon code" value={couponInput}
              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCoupon(null); }} />
            <button type="button" className="btn btn-outline btn-sm btn-inline" onClick={applyCoupon}>Apply</button>
          </div>
          {couponError && <p className="field-error">{couponError}</p>}

          <div className="summary-row"><span>Items ({count})</span><span>{formatPrice(subtotal)}</span></div>
          {discount > 0 && <div className="summary-row discount"><span>Coupon {coupon!.code}</span><span>-{formatPrice(discount)}</span></div>}
          <div className="summary-row"><span>Delivery</span>{deliveryFee > 0 ? <span>{formatPrice(deliveryFee)}</span> : <span className="free">Free</span>}</div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : paymentMethod === 'COD' ? 'Place order' : <><Lock size={16} /> Pay {formatPrice(total)}</>}
          </button>
          <Link to="/cart" className="continue-link">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
