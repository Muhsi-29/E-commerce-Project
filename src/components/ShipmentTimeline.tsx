import { Check, X } from 'lucide-react';
import type { Shipment } from '../types.ts';
import { formatDate } from '../utils/format.ts';

// Ordered → Shipped → Delivered, with dates (or the cancellation)
export default function ShipmentTimeline({ shipment, orderedAt }: { shipment: Shipment; orderedAt: string }) {
  if (shipment.status === 'CANCELLED') {
    return (
      <div className="timeline cancelled">
        <span className="timeline-step done"><Check size={12} /> Ordered {formatDate(orderedAt)}</span>
        <span className="timeline-step cancelled"><X size={12} /> Cancelled {shipment.cancelledAt ? formatDate(shipment.cancelledAt) : ''}</span>
        {shipment.cancelReason && <span className="timeline-note">{shipment.cancelReason}</span>}
      </div>
    );
  }

  const steps = [
    { label: 'Ordered', date: orderedAt, done: true },
    { label: 'Shipped', date: shipment.shippedAt, done: Boolean(shipment.shippedAt) },
    { label: 'Delivered', date: shipment.deliveredAt, done: Boolean(shipment.deliveredAt) },
  ];

  return (
    <div className="timeline">
      <ol className="timeline-steps">
        {steps.map(step => (
          <li key={step.label} className={`timeline-step ${step.done ? 'done' : ''}`}>
            <span className="timeline-dot">{step.done && <Check size={11} />}</span>
            <span className="timeline-label">{step.label}</span>
            {step.date && <span className="timeline-date">{formatDate(step.date)}</span>}
          </li>
        ))}
      </ol>
      {shipment.trackingNumber && (
        <span className="timeline-note">
          {shipment.courier ? `${shipment.courier} · ` : ''}Tracking number <strong>{shipment.trackingNumber}</strong>
        </span>
      )}
    </div>
  );
}
