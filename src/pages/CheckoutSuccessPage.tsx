import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { useCart } from '../context/cart.ts';
import type { Order } from '../types.ts';
import { formatPrice } from '../utils/format.ts';
import PageState from '../components/PageState.tsx';

// Stripe sends the shopper here after paying (?session_id=...). We ask the backend to check the
// payment with Stripe, which marks the order PAID and empties the cart.
export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refresh } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(sessionId ? '' : 'Missing payment details.');
  const confirmed = useRef(false);

  useEffect(() => {
    if (!sessionId || confirmed.current) return;
    confirmed.current = true;
    api.post('/orders/checkout/confirm', { sessionId })
      .then(res => {
        setOrder(res.data.data);
        refresh().catch(() => {});
      })
      .catch(err => setError(getErrorMessage(err)));
  }, [sessionId, refresh]);

  if (error) {
    return (
      <PageState
        icon={<XCircle size={56} color="var(--error)" />}
        title="We couldn't confirm your payment"
        message={`${error} If you were charged, your order will update shortly. Check your orders page.`}
        action={<Link to="/orders" className="btn btn-primary btn-inline">View my orders</Link>}
      />
    );
  }

  if (!order) return <PageState loading message="Confirming your payment..." />;

  const paid = order.status === 'PAID';
  return (
    <PageState
      icon={paid ? <CheckCircle2 size={64} color="var(--accent)" /> : <Clock size={64} color="#d97706" />}
      title={paid ? 'Thank you! Your order is confirmed.' : 'Your payment is being processed'}
      message={paid
        ? `Order #${order.id} for ${formatPrice(order.totalAmount)} is paid. We've emailed your invoice to ${order.user.email}.`
        : `Order #${order.id} will update as soon as Stripe confirms the payment.`}
      action={
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/orders" className="btn btn-primary btn-inline">View my orders</Link>
          <Link to="/products" className="btn btn-outline btn-inline">Keep shopping</Link>
        </div>
      }
    />
  );
}
