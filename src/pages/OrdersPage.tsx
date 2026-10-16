import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PackageOpen, CreditCard, Banknote, Smartphone, MapPin, FileText, RotateCcw, Star as StarIcon } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import type { Order, OrderItem, PaymentMethod, Shipment } from '../types.ts';
import { formatAddress } from '../utils/address.ts';
import { formatDate, formatPrice } from '../utils/format.ts';
import { RETURN_REASONS } from '../utils/returns.ts';
import ProductImage from '../components/ProductImage.tsx';
import PageState from '../components/PageState.tsx';
import StatusBadge from '../components/StatusBadge.tsx';
import ShipmentTimeline from '../components/ShipmentTimeline.tsx';
import { StarInput } from '../components/StarRating.tsx';
import './OrdersPage.css';

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; icon: typeof CreditCard }> = {
  STRIPE: { label: 'Card', icon: CreditCard },
  RAZORPAY: { label: 'UPI / online', icon: Smartphone },
  COD: { label: 'Cash on delivery', icon: Banknote },
};

const RETURN_STATUS: Record<string, string> = {
  REQUESTED: 'Return requested: waiting for the seller',
  REFUNDED: 'Returned and refunded',
  REJECTED: 'Return declined',
};

// Ask to return one item
function ReturnForm({ item, cod, onDone, onCancel }: { item: OrderItem; cod: boolean; onDone: (message: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('DAMAGED');
  const [comment, setComment] = useState('');
  const [refundUpi, setRefundUpi] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post(`/orders/items/${item.id}/return`, { reason, comment: comment || undefined, refundUpi: refundUpi || undefined });
      onDone(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form className="return-form" onSubmit={submit}>
      <select className="input-field" value={reason} onChange={e => setReason(e.target.value)} aria-label="Reason for return">
        {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <input className="input-field" placeholder="Tell us more (optional)" value={comment} maxLength={500} onChange={e => setComment(e.target.value)} />
      {cod && (
        <input className="input-field" placeholder="UPI ID for your refund (e.g. name@okhdfc)" value={refundUpi} required onChange={e => setRefundUpi(e.target.value)} />
      )}
      {error && <p className="field-error">{error}</p>}
      <div className="return-form-actions">
        <button type="button" className="btn btn-outline btn-sm btn-inline" onClick={onCancel}>Back</button>
        <button type="submit" className="btn btn-primary btn-sm btn-inline" disabled={saving}>Request return</button>
      </div>
    </form>
  );
}

// Rate the seller of a delivered shipment
function RateSeller({ shipment, onDone }: { shipment: Shipment; onDone: (message: string) => void }) {
  const [rating, setRating] = useState(shipment.sellerRating ?? 0);
  const [error, setError] = useState('');

  const rate = async (value: number) => {
    setRating(value);
    try {
      const res = await api.post(`/shipments/${shipment.id}/rating`, { rating: value });
      onDone(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="rate-seller">
      <span><StarIcon size={14} /> Rate {shipment.sellerName}:</span>
      <StarInput value={rating} onChange={rate} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const placedId = searchParams.get('placed');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [returningItem, setReturningItem] = useState<number | null>(null);

  const load = () =>
    api.get('/orders')
      .then(res => setOrders(res.data.data))
      .catch(err => setError(getErrorMessage(err)));

  useEffect(() => { load(); }, []);

  const done = (text: string) => {
    setMessage(text);
    setError('');
    setReturningItem(null);
    load();
  };

  const cancelOrder = async (orderId: number) => {
    setError('');
    setMessage('');
    setCancellingId(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/cancel`);
      const refunded = res.data.data.refundedAmount;
      done(`Order #${orderId} was cancelled.${refunded > 0 ? ` A refund of ${formatPrice(refunded)} has been started.` : ''}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  };

  if (!orders && !error) return <PageState loading />;

  if (orders && orders.length === 0) {
    return (
      <PageState
        icon={<PackageOpen size={56} strokeWidth={1.5} />}
        title="No orders yet"
        message="When you place an order, it will show up here."
        action={<Link to="/products" className="btn btn-primary btn-inline">Start shopping</Link>}
      />
    );
  }

  return (
    <div className="container orders-page">
      <div className="page-header">
        <h1>Your orders</h1>
      </div>

      {placedId && (
        <div className="alert alert-success">
          Thank you! Order #{placedId} has been placed. We've emailed you the details and will let you know when it ships.
        </div>
      )}
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="orders-list">
        {orders?.map(order => {
          const payment = PAYMENT_LABELS[order.paymentMethod];
          const awaitingPayment = order.status === 'PENDING' && order.paymentMethod !== 'COD';
          return (
            <article key={order.id} className={`card order-card ${String(order.id) === placedId ? 'highlight' : ''}`}>
              <header className="order-header">
                <div><span>Order placed</span><strong>{formatDate(order.createdAt)}</strong></div>
                <div><span>Total</span><strong>{formatPrice(order.totalAmount)}</strong></div>
                <div><span>Payment</span><strong className="order-payment"><payment.icon size={14} /> {payment.label}</strong></div>
                <div className="order-number">
                  <span>Order #{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>
              </header>

              {awaitingPayment && <p className="order-banner">Waiting for your payment to go through.</p>}

              {order.shipments.map((shipment, index) => {
                const shipmentItems = order.items.filter(item => item.shipmentId === shipment.id);
                return (
                  <section key={shipment.id} className="shipment">
                    <div className="shipment-head">
                      <strong>
                        {order.shipments.length > 1 ? `Shipment ${index + 1} of ${order.shipments.length}` : 'Shipment'}
                      </strong>
                      <span className="muted small">
                        Sold by {shipment.seller ? <Link to={`/store/${shipment.seller.slug}`}>{shipment.sellerName}</Link> : shipment.sellerName}
                      </span>
                    </div>
                    <ShipmentTimeline shipment={shipment} orderedAt={order.createdAt} />

                    <ul className="order-items">
                      {shipmentItems.map(item => (
                        <li key={item.id}>
                          <Link to={`/products/${item.productId}`} className="order-item-image"><ProductImage product={item.product} /></Link>
                          <div className="order-item-info">
                            <Link to={`/products/${item.productId}`}>{item.product.title}</Link>
                            <span>{item.quantity} × {formatPrice(item.price)}</span>
                            {item.returnRequest && (
                              <span className={`return-status return-${item.returnRequest.status.toLowerCase()}`}>
                                <RotateCcw size={12} /> {RETURN_STATUS[item.returnRequest.status]}
                                {item.returnRequest.status === 'REFUNDED' && ` (${formatPrice(item.returnRequest.refundAmount)})`}
                                {item.returnRequest.resolutionNote && `: ${item.returnRequest.resolutionNote}`}
                              </span>
                            )}
                            {returningItem === item.id && (
                              <ReturnForm item={item} cod={order.paymentMethod === 'COD'} onDone={done} onCancel={() => setReturningItem(null)} />
                            )}
                          </div>
                          <div className="order-item-actions">
                            {shipment.status === 'DELIVERED' && (
                              <Link to={`/products/${item.productId}#reviews`} className="btn btn-outline btn-sm btn-inline">Write a review</Link>
                            )}
                            {item.canReturn && returningItem !== item.id && (
                              <button className="btn-link" onClick={() => setReturningItem(item.id)}>
                                Return (until {formatDate(item.returnUntil!)})
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {shipment.status === 'DELIVERED' && shipment.seller && <RateSeller shipment={shipment} onDone={done} />}
                  </section>
                );
              })}

              <footer className="order-footer">
                <div className="order-footer-info">
                  {order.shippingAddress && (
                    <p className="order-address"><MapPin size={14} /> {order.shippingAddress.fullName}, {formatAddress(order.shippingAddress)}</p>
                  )}
                  <p className="order-money">
                    Items {formatPrice(order.subtotal)}
                    {order.discount > 0 && ` · Coupon ${order.couponCode} -${formatPrice(order.discount)}`}
                    {` · Delivery ${order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : 'free'}`}
                    {order.refundedAmount > 0 && <strong className="refunded"> · Refunded {formatPrice(order.refundedAmount)}</strong>}
                  </p>
                </div>
                <div className="order-footer-actions">
                  <Link to={`/orders/${order.id}/invoice`} className="btn btn-outline btn-sm btn-inline"><FileText size={14} /> Invoice</Link>
                  {order.canCancel && (confirmId === order.id ? (
                    <span className="order-confirm">
                      Cancel this order?
                      <button className="btn btn-danger btn-sm btn-inline" onClick={() => cancelOrder(order.id)} disabled={cancellingId === order.id}>
                        {cancellingId === order.id ? 'Cancelling...' : 'Yes, cancel'}
                      </button>
                      <button className="btn btn-outline btn-sm btn-inline" onClick={() => setConfirmId(null)}>Keep it</button>
                    </span>
                  ) : (
                    <button className="btn btn-outline btn-sm btn-inline" onClick={() => setConfirmId(order.id)}>Cancel order</button>
                  ))}
                </div>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
