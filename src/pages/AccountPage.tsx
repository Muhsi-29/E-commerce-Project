import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, MapPin, Store, ShieldCheck, ExternalLink } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../api.ts';
import { ADMIN_URL } from '../config.ts';
import { useAuth } from '../context/auth.ts';
import './AccountPages.css';

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<'profile' | 'password' | null>(null);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving('profile');
    try {
      await api.patch('/auth/me', { name });
      await refreshUser();
      setProfileMessage({ type: 'success', text: 'Your name has been updated.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    if (passwords.newPassword !== passwords.confirm) {
      setPasswordMessage({ type: 'error', text: "The new passwords don't match." });
      return;
    }
    setSaving('password');
    try {
      await api.post('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      setPasswordMessage({ type: 'success', text: 'Password changed.' });
    } catch (err) {
      setPasswordErrors(getFieldErrors(err));
      setPasswordMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(null);
    }
  };

  const seller = user?.seller;

  return (
    <div className="container account-page">
      <div className="page-header">
        <h1>Your account</h1>
        <p>{user?.email}</p>
      </div>

      <div className="account-links">
        <Link to="/orders" className="card account-link"><Package size={22} /><div><strong>Your orders</strong><span>Track, cancel, return or review</span></div></Link>
        <Link to="/wishlist" className="card account-link"><Heart size={22} /><div><strong>Wishlist</strong><span>Products you saved</span></div></Link>
        <Link to="/account/addresses" className="card account-link"><MapPin size={22} /><div><strong>Addresses</strong><span>Your saved delivery addresses</span></div></Link>
        {seller?.status === 'APPROVED' || seller?.status === 'SUSPENDED' ? (
          <Link to="/seller" className="card account-link"><Store size={22} /><div><strong>Seller dashboard</strong><span>{seller.storeName}</span></div></Link>
        ) : (
          <Link to="/sell" className="card account-link"><Store size={22} /><div><strong>{seller ? 'Seller application' : 'Sell on Shoyo'}</strong><span>{seller ? `Status: ${seller.status.toLowerCase()}` : 'Open your own store'}</span></div></Link>
        )}
        {user?.role === 'ADMIN' && (
          <a href={ADMIN_URL} className="card account-link"><ShieldCheck size={22} /><div><strong>Admin panel <ExternalLink size={12} /></strong><span>Manage the store</span></div></a>
        )}
      </div>

      <div className="account-forms">
        <form className="card account-form" onSubmit={saveProfile}>
          <h2>Profile</h2>
          {profileMessage && <div className={`alert alert-${profileMessage.type}`}>{profileMessage.text}</div>}
          <div className="input-group">
            <label className="input-label" htmlFor="acc-name">Full name</label>
            <input id="acc-name" className="input-field" value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="acc-email">Email</label>
            <input id="acc-email" className="input-field" value={user?.email ?? ''} disabled />
          </div>
          <button type="submit" className="btn btn-primary btn-inline" disabled={saving === 'profile'}>Save</button>
        </form>

        <form className="card account-form" onSubmit={changePassword}>
          <h2>Change password</h2>
          {passwordMessage && <div className={`alert alert-${passwordMessage.type}`}>{passwordMessage.text}</div>}
          <div className="input-group">
            <label className="input-label" htmlFor="acc-current">Current password</label>
            <input id="acc-current" type="password" className="input-field" autoComplete="current-password" required
              value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
            {passwordErrors.currentPassword && <span className="field-error">Current password {passwordErrors.currentPassword}</span>}
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="acc-new">New password</label>
            <input id="acc-new" type="password" className="input-field" autoComplete="new-password" minLength={8} required
              value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
            <span className="input-hint">At least 8 characters.</span>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="acc-confirm">Confirm new password</label>
            <input id="acc-confirm" type="password" className="input-field" autoComplete="new-password" required
              value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary btn-inline" disabled={saving === 'password'}>Change password</button>
        </form>
      </div>
    </div>
  );
}
