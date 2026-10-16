import { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { api, getErrorMessage } from '../../api.ts';
import type { ReturnListItem, ReturnStatus } from '../../types.ts';
import { formatDate, formatPrice } from '../../utils/format.ts';
import { returnReasonLabel } from '../../utils/returns.ts';
import ProductImage from '../../components/ProductImage.tsx';
import PageState from '../../components/PageState.tsx';

const STATUS: Record<ReturnStatus, { label: string; className: string }> = {
  REQUESTED: { label: 'Waiting for you', className: 'badge-pending' },
  REFUNDED: { label: 'Refunded', className: 'badge-delivered' },
  REJECTED: { label: 'Declined', className: 'badge-cancelled' },
};

interface SellerReturnsProps {
  readOnly: boolean;
  onChanged: () => void;
}

// Return requests for the seller's products: approve (refunds the buyer and restocks) or decline with a note
export default function SellerReturns({ readOnly, onChanged }: SellerReturnsProps) {
  const [returns, setReturns] = useState<ReturnListItem[] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    api.get('/seller/returns').then(res => setReturns(res.data.data)).catch(err => setMessage({ type: 'error', text: getErrorMessage(err) }));
  }, []);

  useEffect(load, [load]);

  const resolve = async (id: number, action: 'approve' | 'reject') => {
    setBusy(id);
    try {
      const res = await api.patch(`/seller/returns/${id}`, { action, note: notes[id] || undefined });
      setMessage({ type: 'success', text: res.data.message });
      load();
      onChanged();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  if (!returns && !message) return <PageState loading />;

  return (
    <div className="card seller-panel">
      <div className="panel-heading"><h2>Returns</h2></div>
      <p className="muted small panel-note">
        Approving a return refunds the buyer (to their card, UPI, or the UPI ID they gave for cash orders) and puts the item back in stock.
        The refunded amount is taken from your earnings.
      </p>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {returns?.length === 0 ? (
        <PageState icon={<RotateCcw size={44} strokeWidth={1.5} />} title="No return requests" message="Requests from buyers will show up here." />
      ) : (
        <ul className="seller-orders">
          {returns?.map(r => (
            <li key={r.id} className="seller-order">
              <div className="seller-order-head">
                <div>
                  <strong>Order #{r.orderItem.order.id}</strong>
                  <span className="muted small"> · requested {formatDate(r.createdAt)} by {r.user.name}</span>
                </div>
                <span className={`badge ${STATUS[r.status].className}`}>{STATUS[r.status].label}</span>
              </div>
              <ul className="seller-order-items">
                <li>
                  <div className="table-thumb"><ProductImage product={r.orderItem.product} /></div>
                  <span>{r.orderItem.product.title}</span>
                  <span className="muted">× {r.orderItem.quantity}</span>
                  <span>{formatPrice(r.orderItem.price * r.orderItem.quantity)}</span>
                </li>
              </ul>
              <div className="seller-order-meta">
                <span><strong>Reason:</strong> {returnReasonLabel(r.reason)}{r.comment ? ` — "${r.comment}"` : ''}</span>
                {r.orderItem.order.paymentMethod === 'COD' && r.refundUpi && <span>Refund to UPI: {r.refundUpi}</span>}
                {r.status === 'REFUNDED' && <span>Refunded {formatPrice(r.refundAmount)}</span>}
                {r.resolutionNote && <span>Note: {r.resolutionNote}</span>}
              </div>
              {r.status === 'REQUESTED' && !readOnly && (
                <div className="inline-form">
                  <input
                    className="input-field" placeholder="Note to the buyer (optional)" maxLength={300}
                    value={notes[r.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                    aria-label="Note to the buyer"
                  />
                  <button className="btn btn-primary btn-sm btn-inline" disabled={busy === r.id} onClick={() => resolve(r.id, 'approve')}>Approve and refund</button>
                  <button className="btn btn-outline btn-sm btn-inline" disabled={busy === r.id} onClick={() => resolve(r.id, 'reject')}>Decline</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
