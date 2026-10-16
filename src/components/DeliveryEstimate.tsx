import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { MapPin, Truck } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { useStoreConfig } from '../context/storeConfig.ts';
import type { DeliveryEstimate as Estimate } from '../types.ts';
import { formatPrice } from '../utils/format.ts';
import { getPincode, savePincode } from '../utils/pincode.ts';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// "Delivery by Mon, 19 Oct" for the shopper's PIN code (remembered in this browser)
export default function DeliveryEstimate({ productId }: { productId: number }) {
  const config = useStoreConfig();
  const [pincode, setPincode] = useState(getPincode);
  const [input, setInput] = useState(pincode);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState('');

  const check = useCallback(async (pin: string) => {
    setError('');
    try {
      const res = await api.get('/delivery/estimate', { params: { pincode: pin, productId } });
      setEstimate(res.data.data);
      savePincode(pin);
      setPincode(pin);
    } catch (err) {
      setEstimate(null);
      setError(getErrorMessage(err, 'Please enter a valid 6-digit PIN code.'));
    }
  }, [productId]);

  // Check the saved PIN code straight away (and again when moving to another product)
  useEffect(() => {
    const saved = getPincode();
    if (saved) check(saved);
  }, [check]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) check(input.trim());
  };

  return (
    <div className="delivery-estimate">
      <form className="pincode-form" onSubmit={submit}>
        <MapPin size={16} />
        <input
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter PIN code"
          aria-label="Delivery PIN code"
          value={input}
          onChange={e => setInput(e.target.value.replace(/\D/g, ''))}
        />
        <button type="submit" className="btn-link">Check</button>
      </form>
      {error && <p className="field-error">{error}</p>}
      {estimate && (
        <p className="delivery-line">
          <Truck size={16} />
          <span>
            Delivery by <strong>{day(estimate.latest)}</strong> to {estimate.pincode}
            {estimate.minDays <= 2 && ' · fast delivery'}
          </span>
        </p>
      )}
      <p className="delivery-note">
        Free delivery on orders over {formatPrice(config.delivery.freeThreshold)} · Cash on delivery available · {config.returnWindowDays}-day returns
      </p>
    </div>
  );
}
