import { useState, type FormEvent } from 'react';
import { api, getErrorMessage } from '../api.ts';
import type { ShipmentStatus } from '../types.ts';

interface ShipmentActionsProps {
  shipmentId: number;
  nextStatuses: ShipmentStatus[];
  waitingForPayment?: boolean;
  onUpdated: (message: string) => void;
  onError: (message: string) => void;
}

// Buttons for whoever ships an order (the seller, or an admin): mark shipped (with tracking), delivered, or cancel
export default function ShipmentActions({ shipmentId, nextStatuses, waitingForPayment, onUpdated, onError }: ShipmentActionsProps) {
  const [mode, setMode] = useState<'idle' | 'ship' | 'cancel'>('idle');
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (status: ShipmentStatus, extra: object = {}) => {
    setBusy(true);
    try {
      const res = await api.patch(`/shipments/${shipmentId}`, { status, ...extra });
      setMode('idle');
      onUpdated(res.data.message);
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (nextStatuses.length === 0) {
    return waitingForPayment ? <span className="muted small">Waiting for payment</span> : null;
  }

  if (mode === 'ship') {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      send('SHIPPED', { courier: courier || undefined, trackingNumber: trackingNumber || undefined });
    };
    return (
      <form className="inline-form" onSubmit={submit}>
        <input className="input-field" placeholder="Courier (e.g. Delhivery)" value={courier} onChange={e => setCourier(e.target.value)} maxLength={60} aria-label="Courier" />
        <input className="input-field" placeholder="Tracking number" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} maxLength={60} aria-label="Tracking number" />
        <button type="submit" className="btn btn-primary btn-sm btn-inline" disabled={busy}>Confirm shipped</button>
        <button type="button" className="btn btn-outline btn-sm btn-inline" onClick={() => setMode('idle')}>Back</button>
      </form>
    );
  }

  if (mode === 'cancel') {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      send('CANCELLED', { reason: reason || undefined });
    };
    return (
      <form className="inline-form" onSubmit={submit}>
        <input className="input-field" placeholder="Reason (shown to the customer)" value={reason} onChange={e => setReason(e.target.value)} maxLength={300} aria-label="Cancellation reason" />
        <button type="submit" className="btn btn-danger btn-sm btn-inline" disabled={busy}>Cancel and restock</button>
        <button type="button" className="btn btn-outline btn-sm btn-inline" onClick={() => setMode('idle')}>Back</button>
      </form>
    );
  }

  return (
    <div className="shipment-actions">
      {nextStatuses.includes('SHIPPED') && (
        <button className="btn btn-primary btn-sm btn-inline" onClick={() => setMode('ship')}>Mark as shipped</button>
      )}
      {nextStatuses.includes('DELIVERED') && (
        <button className="btn btn-primary btn-sm btn-inline" disabled={busy} onClick={() => send('DELIVERED')}>Mark as delivered</button>
      )}
      {nextStatuses.includes('CANCELLED') && (
        <button className="btn btn-outline btn-sm btn-inline" onClick={() => setMode('cancel')}>Cancel</button>
      )}
    </div>
  );
}
