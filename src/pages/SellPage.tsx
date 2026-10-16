import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Store, ClipboardCheck, PackageCheck, Wallet, Clock, XCircle, ArrowRight } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../api.ts';
import { useAuth } from '../context/auth.ts';
import { useStoreConfig } from '../context/storeConfig.ts';
import type { Seller } from '../types.ts';
import { emptyStoreDetails, formatRate, storeDetailsFrom, type StoreDetails } from '../utils/seller.ts';
import StoreDetailsForm from '../components/StoreDetailsForm.tsx';
import PageState from '../components/PageState.tsx';
import './AccountPages.css';

// "Sell on Shoyo": how it works, the application form, and where your application stands
export default function SellPage() {
  const { user, loading, refreshUser } = useAuth();
  const config = useStoreConfig();
  const seller = user?.seller ?? null;
  const [details, setDetails] = useState<StoreDetails>(emptyStoreDetails);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // A rejected applicant can fix their details and apply again: start from what they sent last time
  useEffect(() => {
    if (seller?.status !== 'REJECTED') return;
    api.get('/seller/me').then(res => setDetails(storeDetailsFrom(res.data.data.seller as Seller))).catch(() => {});
  }, [seller?.status]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      await api.post('/sellers/apply', { ...details, gstin: details.gstin || undefined, description: details.description || undefined });
      await refreshUser();
      window.scrollTo(0, 0);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageState loading />;

  const steps = [
    { icon: ClipboardCheck, title: 'Apply in minutes', text: 'Tell us about your store, pickup address and UPI ID.' },
    { icon: Store, title: 'Get approved', text: 'Our team reviews new stores, usually within a day.' },
    { icon: PackageCheck, title: 'List and ship', text: 'Add products, then pack and ship the orders you receive.' },
    { icon: Wallet, title: 'Get paid', text: `Earnings from delivered orders go to your UPI. Commission: ${formatRate(config.sellerCommissionRate)}.` },
  ];

  let body;
  if (!user) {
    body = (
      <div className="card sell-status">
        <h2>Ready to start?</h2>
        <p className="muted">Log in or create a free account, then fill in the short application.</p>
        <Link to="/auth?redirect=%2Fsell" className="btn btn-primary btn-inline">Log in to apply <ArrowRight size={16} /></Link>
      </div>
    );
  } else if (user.role === 'ADMIN') {
    body = (
      <div className="card sell-status">
        <h2>Admin accounts can't open a store</h2>
        <p className="muted">Create a separate shopper account to try selling.</p>
      </div>
    );
  } else if (seller?.status === 'PENDING') {
    body = (
      <div className="card sell-status">
        <Clock size={36} className="narrow-icon" />
        <h2>"{seller.storeName}" is being reviewed</h2>
        <p className="muted">Thanks for applying! We'll email you at {user.email} as soon as your store is approved.</p>
      </div>
    );
  } else if (seller?.status === 'APPROVED' || seller?.status === 'SUSPENDED') {
    body = (
      <div className="card sell-status">
        <Store size={36} className="narrow-icon" />
        <h2>You're selling as "{seller.storeName}"</h2>
        <p className="muted">Manage your products, orders, returns and payouts from your dashboard.</p>
        <div className="form-actions start">
          <Link to="/seller" className="btn btn-primary btn-inline">Open seller dashboard</Link>
          {seller.status === 'APPROVED' && <Link to={`/store/${seller.slug}`} className="btn btn-outline btn-inline">View your store</Link>}
        </div>
      </div>
    );
  } else {
    body = (
      <form className="card sell-form" onSubmit={submit}>
        <h2>{seller ? 'Apply again' : 'Open your store'}</h2>
        {seller?.status === 'REJECTED' && (
          <div className="alert alert-error">
            <XCircle size={16} /> Your last application was not approved{seller.statusReason ? `: ${seller.statusReason}` : '.'} You can update your details and apply again.
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        <StoreDetailsForm value={details} onChange={setDetails} errors={fieldErrors} />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-inline" disabled={submitting}>{submitting ? 'Sending...' : 'Submit application'}</button>
        </div>
      </form>
    );
  }

  return (
    <div className="container account-page">
      <div className="sell-hero">
        <h1>Sell on Shoyo</h1>
        <p>Reach shoppers across India. List your products, we handle the storefront, payments and returns process.</p>
      </div>
      <div className="sell-steps">
        {steps.map(step => (
          <div key={step.title} className="card sell-step">
            <step.icon size={24} />
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </div>
        ))}
      </div>
      {body}
    </div>
  );
}
