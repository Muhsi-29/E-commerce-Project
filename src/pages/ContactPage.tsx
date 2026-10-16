import { useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, Clock, Package, CheckCircle2 } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../api.ts';
import { useAuth } from '../context/auth.ts';
import type { User } from '../types.ts';
import PageState from '../components/PageState.tsx';
import './AccountPages.css';

export default function ContactPage() {
  const { user, loading } = useAuth();
  // Wait for the login check so a signed-in shopper's name and email are filled in
  return loading ? <PageState loading /> : <ContactForm user={user} />;
}

function ContactForm({ user }: { user: User | null }) {
  const [values, setValues] = useState({ name: user?.name ?? '', email: user?.email ?? '', subject: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [sending, setSending] = useState(false);

  const set = (field: keyof typeof values) => (e: { target: { value: string } }) => setValues(v => ({ ...v, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSending(true);
    try {
      const res = await api.post('/contact', values);
      setSent(res.data.message);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const fieldError = (field: string, label: string) => fieldErrors[field] && <span className="field-error">{label} {fieldErrors[field]}</span>;

  return (
    <div className="container info-page">
      <nav className="info-nav" aria-label="Help topics">
        <NavLink to="/help/shipping">Shipping</NavLink>
        <NavLink to="/help/returns">Returns & refunds</NavLink>
        <NavLink to="/privacy">Privacy</NavLink>
        <NavLink to="/terms">Terms</NavLink>
        <NavLink to="/contact">Contact us</NavLink>
      </nav>
      <div className="page-header">
        <h1>Contact us</h1>
        <p>Questions about an order, a return or selling on Shoyo? We're happy to help.</p>
      </div>

      <div className="contact-layout">
        {sent ? (
          <div className="card info-content">
            <CheckCircle2 size={40} className="narrow-icon" />
            <h2>Message sent</h2>
            <p>{sent}</p>
          </div>
        ) : (
          <form className="card info-content" onSubmit={submit}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="address-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="c-name">Your name</label>
                <input id="c-name" className="input-field" autoComplete="name" value={values.name} onChange={set('name')} required maxLength={100} />
                {fieldError('name', 'Name')}
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="c-email">Email</label>
                <input id="c-email" type="email" className="input-field" autoComplete="email" value={values.email} onChange={set('email')} required />
                {fieldError('email', 'Email')}
              </div>
              <div className="input-group wide">
                <label className="input-label" htmlFor="c-subject">Subject</label>
                <input id="c-subject" className="input-field" placeholder="e.g. Where is order #1042?" value={values.subject} onChange={set('subject')} required maxLength={150} />
                {fieldError('subject', 'Subject')}
              </div>
              <div className="input-group wide">
                <label className="input-label" htmlFor="c-message">Message</label>
                <textarea id="c-message" className="input-field" rows={6} value={values.message} onChange={set('message')} required minLength={10} maxLength={3000} />
                {fieldError('message', 'Message')}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-inline" disabled={sending}>{sending ? 'Sending...' : 'Send message'}</button>
          </form>
        )}

        <aside className="card contact-aside">
          <div><Clock size={18} /><span>We reply within one working day, Monday to Saturday.</span></div>
          <div><Package size={18} /><span>For an order, include the order number from <strong>Your orders</strong>.</span></div>
          <div><Mail size={18} /><span>Messages go straight to our support team.</span></div>
        </aside>
      </div>
    </div>
  );
}
