import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import './AccountPages.css';

// "Forgot password?": emails a one-time reset link
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container narrow-page">
      <div className="card narrow-card">
        {sent ? (
          <>
            <MailCheck size={40} className="narrow-icon" />
            <h1>Check your email</h1>
            <p className="muted">{sent} The link works for 30 minutes.</p>
            <Link to="/auth" className="btn btn-primary">Back to login</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <KeyRound size={40} className="narrow-icon" />
            <h1>Forgot your password?</h1>
            <p className="muted">Enter your email and we'll send you a link to choose a new one.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="input-group">
              <label className="input-label" htmlFor="fp-email">Email address</label>
              <input id="fp-email" type="email" className="input-field" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Sending...' : 'Send reset link'}</button>
            <Link to="/auth" className="continue-link block-link">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}

// The page the reset link opens: choose a new password
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/auth?reset=1', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="container narrow-page">
      <form className="card narrow-card" onSubmit={submit}>
        <KeyRound size={40} className="narrow-icon" />
        <h1>Choose a new password</h1>
        {!token && <div className="alert alert-error">This link is incomplete. Please use the link from your email.</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <div className="input-group">
          <label className="input-label" htmlFor="rp-password">New password</label>
          <input id="rp-password" type="password" className="input-field" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} />
          <span className="input-hint">At least 8 characters.</span>
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="rp-confirm">Confirm new password</label>
          <input id="rp-confirm" type="password" className="input-field" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || !token}>{saving ? 'Saving...' : 'Save new password'}</button>
        <Link to="/auth/forgot-password" className="continue-link block-link">Need a new link?</Link>
      </form>
    </div>
  );
}
