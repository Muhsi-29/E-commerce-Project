import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { paymentMethodsText, useStoreConfig } from '../context/storeConfig.ts';
import { formatPrice } from '../utils/format.ts';
import './Footer.css';

export default function Footer() {
  const config = useStoreConfig();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const subscribe = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/newsletter', { email });
      setStatus({ type: 'success', text: res.data.message });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="footer-container">
      <div className="footer-promises">
        <div><Truck size={20} /><span>Free delivery over {formatPrice(config.delivery.freeThreshold)}</span></div>
        <div><RotateCcw size={20} /><span>{config.returnWindowDays}-day easy returns</span></div>
        <div><ShieldCheck size={20} /><span>Pay by {paymentMethodsText(config)}</span></div>
      </div>

      <div className="footer-content">
        <div className="footer-brand-section">
          <div className="footer-brand">
            <ShoppingBag className="footer-brand-icon" />
            <h2>Shoyo</h2>
          </div>
          <p className="footer-description">
            A marketplace for everyday essentials and things you'll love, from Shoyo Retail and independent sellers across India.
          </p>
        </div>

        <div className="footer-links-group">
          <h3>Shop</h3>
          <Link to="/products?sort=newest">New arrivals</Link>
          <Link to="/products?sort=discount">Top deals</Link>
          <Link to="/products?sort=rating">Top rated</Link>
          <Link to="/products">All products</Link>
          <Link to="/sell">Sell on Shoyo</Link>
        </div>

        <div className="footer-links-group">
          <h3>Help</h3>
          <Link to="/orders">Your orders</Link>
          <Link to="/help/shipping">Shipping & delivery</Link>
          <Link to="/help/returns">Returns & refunds</Link>
          <Link to="/contact">Contact us</Link>
        </div>

        <div className="footer-newsletter">
          <h3>Stay in the loop</h3>
          <p>Get new arrivals and members-only offers in your inbox. No spam, unsubscribe any time.</p>
          <form className="newsletter-form" onSubmit={subscribe}>
            <div className="newsletter-input-wrapper">
              <Mail className="newsletter-icon" size={18} />
              <input type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address" />
            </div>
            <button type="submit" className="btn btn-accent newsletter-btn" disabled={sending}>{sending ? 'Subscribing...' : 'Subscribe'}</button>
            {status && <p className={`newsletter-status ${status.type}`} role="status">{status.text}</p>}
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Shoyo. A portfolio demo store.</p>
        <div className="footer-legal">
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of use</Link>
        </div>
      </div>
    </footer>
  );
}
