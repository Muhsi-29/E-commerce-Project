import { useState, type FormEvent } from 'react';
import { api, getErrorMessage, getFieldErrors } from '../../api.ts';
import { useAuth } from '../../context/auth.ts';
import type { Seller } from '../../types.ts';
import { storeDetailsFrom, type StoreDetails } from '../../utils/seller.ts';
import StoreDetailsForm from '../../components/StoreDetailsForm.tsx';

// Edit the store's name, contact details, pickup address and payout UPI
export default function SellerSettings({ seller, onSaved }: { seller: Seller; onSaved: () => void }) {
  const { refreshUser } = useAuth();
  const [details, setDetails] = useState<StoreDetails>(() => storeDetailsFrom(seller));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSaving(true);
    try {
      const res = await api.patch('/seller/me', details);
      setMessage({ type: 'success', text: res.data.message });
      onSaved();
      await refreshUser(); // The store name also shows in the account menu
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card seller-panel seller-settings" onSubmit={submit}>
      <h2>Store settings</h2>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <StoreDetailsForm value={details} onChange={setDetails} errors={fieldErrors} />
      <p className="muted small">Changing the store name also changes your store's web address.</p>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-inline" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </form>
  );
}
