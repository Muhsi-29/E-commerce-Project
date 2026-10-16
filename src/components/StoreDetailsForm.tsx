import { INDIAN_STATES } from '../utils/address.ts';
import type { StoreDetails } from '../utils/seller.ts';

interface StoreDetailsFormProps {
  value: StoreDetails;
  onChange: (value: StoreDetails) => void;
  errors?: Record<string, string>; // Keyed like the API: "storeName", "pickupAddress.city"
}

// The fields of a seller's store: name, contact, tax ID, pickup address and payout UPI (no <form> of its own)
export default function StoreDetailsForm({ value, onChange, errors = {} }: StoreDetailsFormProps) {
  const set = (field: Exclude<keyof StoreDetails, 'pickupAddress'>) => (e: { target: { value: string } }) =>
    onChange({ ...value, [field]: e.target.value });
  const setPickup = (field: keyof StoreDetails['pickupAddress']) => (e: { target: { value: string } }) =>
    onChange({ ...value, pickupAddress: { ...value.pickupAddress, [field]: e.target.value } });

  const error = (field: string, label: string) =>
    errors[field] && <span className="field-error">{label} {errors[field]}</span>;
  const errorClass = (field: string) => `input-field ${errors[field] ? 'has-error' : ''}`;

  return (
    <div className="address-grid">
      <div className="input-group wide">
        <label className="input-label" htmlFor="store-name">Store name</label>
        <input id="store-name" className={errorClass('storeName')} value={value.storeName} onChange={set('storeName')} required maxLength={60} />
        <span className="input-hint">Shown to shoppers on every product you sell.</span>
        {error('storeName', 'Store name')}
      </div>
      <div className="input-group wide">
        <label className="input-label" htmlFor="store-description">About your store (optional)</label>
        <textarea id="store-description" className={errorClass('description')} rows={3} value={value.description} onChange={set('description')} maxLength={500} />
        {error('description', 'Description')}
      </div>
      <div className="input-group">
        <label className="input-label" htmlFor="store-phone">Business phone</label>
        <input id="store-phone" className={errorClass('phone')} inputMode="tel" autoComplete="tel" value={value.phone} onChange={set('phone')} required />
        {error('phone', 'Phone')}
      </div>
      <div className="input-group">
        <label className="input-label" htmlFor="store-gstin">GSTIN (optional)</label>
        <input id="store-gstin" className={errorClass('gstin')} placeholder="22AAAAA0000A1Z5" value={value.gstin} onChange={set('gstin')} maxLength={15} />
        {error('gstin', 'GSTIN')}
      </div>

      <h3 className="wide form-section-title">Pickup address</h3>
      <div className="input-group wide">
        <label className="input-label" htmlFor="store-line1">Address</label>
        <input id="store-line1" className={errorClass('pickupAddress.line1')} autoComplete="address-line1" value={value.pickupAddress.line1} onChange={setPickup('line1')} required maxLength={200} />
        {error('pickupAddress.line1', 'Address')}
      </div>
      <div className="input-group">
        <label className="input-label" htmlFor="store-city">Town / city</label>
        <input id="store-city" className={errorClass('pickupAddress.city')} autoComplete="address-level2" value={value.pickupAddress.city} onChange={setPickup('city')} required maxLength={100} />
        {error('pickupAddress.city', 'City')}
      </div>
      <div className="input-group">
        <label className="input-label" htmlFor="store-state">State</label>
        <input id="store-state" className={errorClass('pickupAddress.state')} list="store-states" autoComplete="address-level1" value={value.pickupAddress.state} onChange={setPickup('state')} required maxLength={100} />
        <datalist id="store-states">{INDIAN_STATES.map(s => <option key={s} value={s} />)}</datalist>
        {error('pickupAddress.state', 'State')}
      </div>
      <div className="input-group">
        <label className="input-label" htmlFor="store-pin">PIN code</label>
        <input id="store-pin" className={errorClass('pickupAddress.postalCode')} inputMode="numeric" autoComplete="postal-code" maxLength={6} value={value.pickupAddress.postalCode} onChange={setPickup('postalCode')} required />
        <span className="input-hint">Used to estimate delivery times for your products.</span>
        {error('pickupAddress.postalCode', 'PIN code')}
      </div>

      <h3 className="wide form-section-title">Payouts</h3>
      <div className="input-group wide">
        <label className="input-label" htmlFor="store-upi">UPI ID for payouts</label>
        <input id="store-upi" className={errorClass('payoutUpi')} placeholder="yourstore@okhdfcbank" value={value.payoutUpi} onChange={set('payoutUpi')} required maxLength={100} />
        <span className="input-hint">Your earnings from delivered orders are paid here.</span>
        {error('payoutUpi', 'UPI ID')}
      </div>
    </div>
  );
}
