import { useCallback, useEffect, useState } from 'react';
import { Truck, MapPin, Banknote, CreditCard, Star } from 'lucide-react';
import { api, getErrorMessage } from '../../api.ts';
import type { SellerShipment, ShipmentStatus } from '../../types.ts';
import { formatAddress } from '../../utils/address.ts';
import { formatDate, formatPrice } from '../../utils/format.ts';
import { formatRate } from '../../utils/seller.ts';
import ProductImage from '../../components/ProductImage.tsx';
import PageState from '../../components/PageState.tsx';
import ShipmentActions from '../../components/ShipmentActions.tsx';

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: 'To ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// The seller's part of each order: what to pack, where it goes, and the ship / deliver / cancel buttons
export default function SellerOrders({ onChanged }: { onChanged: () => void }) {
  const [shipments, setShipments] = useState<SellerShipment[] | null>(null);
  const [filter, setFilter] = useState<ShipmentStatus | 'ALL'>('PENDING');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    api.get('/seller/shipments').then(res => setShipments(res.data.data)).catch(err => setMessage({ type: 'error', text: getErrorMessage(err) }));
  }, []);

  useEffect(load, [load]);

  if (!shipments && !message) return <PageState loading />;

  const count = (status: ShipmentStatus) => shipments?.filter(s => s.status === status).length ?? 0;
  const visible = (shipments ?? []).filter(s => filter === 'ALL' || s.status === filter);

  return (
    <div className="card seller-panel">
      <div className="panel-heading">
        <h2>Orders</h2>
        <div className="status-filters">
          {(['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ALL'] as const).map(s => (
            <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? `All (${shipments?.length ?? 0})` : `${STATUS_LABELS[s]} (${count(s)})`}
            </button>
          ))}
        </div>
      </div>
      <p className="muted small panel-note">Online orders appear here once they're paid. Cash on delivery orders appear right away.</p>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {visible.length === 0 ? (
        <PageState icon={<Truck size={44} strokeWidth={1.5} />} title="Nothing here" message={filter === 'PENDING' ? 'No orders waiting to be shipped.' : 'No orders in this list.'} />
      ) : (
        <ul className="seller-orders">
          {visible.map(s => (
            <li key={s.id} className="seller-order">
              <div className="seller-order-head">
                <div>
                  <strong>Order #{s.order.id}</strong>
                  <span className="muted small"> · {formatDate(s.order.createdAt)} · {s.order.user.name}</span>
                </div>
                <span className={`badge badge-${s.status === 'PENDING' ? 'pending' : s.status.toLowerCase()}`}>{STATUS_LABELS[s.status]}</span>
              </div>

              <ul className="seller-order-items">
                {s.items.map(item => (
                  <li key={item.id}>
                    <div className="table-thumb"><ProductImage product={item.product} /></div>
                    <span>{item.product.title}</span>
                    <span className="muted">× {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="seller-order-meta">
                {s.order.shippingAddress && (
                  <span><MapPin size={14} /> {s.order.shippingAddress.fullName}, {formatAddress(s.order.shippingAddress)} · {s.order.shippingAddress.phone}</span>
                )}
                <span>
                  {s.order.paymentMethod === 'COD' ? <Banknote size={14} /> : <CreditCard size={14} />}
                  {s.order.paymentMethod === 'COD' ? (s.order.paidAt ? 'Cash collected' : 'Cash on delivery: collect on delivery') : 'Paid online'}
                </span>
                <span>
                  You earn <strong>{formatPrice(s.sellerEarning)}</strong>
                  <span className="muted"> ({formatPrice(s.subtotal)} − {formatRate(s.commissionRate)} commission)</span>
                </span>
                {s.courier && <span><Truck size={14} /> {s.courier}{s.trackingNumber ? ` · ${s.trackingNumber}` : ''}</span>}
                {s.cancelReason && <span className="field-error">Cancelled: {s.cancelReason}</span>}
                {s.sellerRating && (
                  <span><Star size={14} /> Buyer rated you {s.sellerRating}/5{s.sellerFeedback ? `: "${s.sellerFeedback}"` : ''}</span>
                )}
              </div>

              <ShipmentActions
                shipmentId={s.id}
                nextStatuses={s.nextStatuses ?? []}
                onUpdated={text => { setMessage({ type: 'success', text }); load(); onChanged(); }}
                onError={text => setMessage({ type: 'error', text })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
