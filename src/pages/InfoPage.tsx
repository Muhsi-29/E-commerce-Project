import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useStoreConfig } from '../context/storeConfig.ts';
import { formatPrice } from '../utils/format.ts';
import NotFoundPage from './NotFoundPage.tsx';
import './AccountPages.css';

export type InfoTopic = 'shipping' | 'returns' | 'privacy' | 'terms';

const NAV: { topic: InfoTopic; to: string; label: string }[] = [
  { topic: 'shipping', to: '/help/shipping', label: 'Shipping' },
  { topic: 'returns', to: '/help/returns', label: 'Returns & refunds' },
  { topic: 'privacy', to: '/privacy', label: 'Privacy' },
  { topic: 'terms', to: '/terms', label: 'Terms' },
];

// Help and policy pages. Numbers (delivery fee, return window...) come from the store's live settings.
export default function InfoPage({ topic }: { topic: InfoTopic }) {
  const config = useStoreConfig();
  const fee = formatPrice(config.delivery.fee);
  const freeOver = formatPrice(config.delivery.freeThreshold);
  const days = config.returnWindowDays;

  const pages: Record<InfoTopic, { title: string; body: ReactNode }> = {
    shipping: {
      title: 'Shipping & delivery',
      body: (
        <>
          <h2>Delivery charges</h2>
          <p>Delivery is free on orders of {freeOver} or more. Smaller orders have a flat {fee} delivery charge.</p>
          <h2>How long it takes</h2>
          <p>
            Enter your PIN code on any product page to see when it will arrive. Most orders arrive in 2–7 days depending on
            where you are and where the seller ships from. We don't count Sundays.
          </p>
          <h2>Orders from several sellers</h2>
          <p>
            Products from different sellers ship separately, so one order can arrive in more than one package. Each package
            has its own tracking on the <Link to="/orders">Your orders</Link> page.
          </p>
          <h2>Cash on delivery</h2>
          <p>Cash on delivery is available across India. Please keep the exact amount ready.</p>
        </>
      ),
    },
    returns: {
      title: 'Returns & refunds',
      body: (
        <>
          <h2>{days}-day returns</h2>
          <p>
            Most items can be returned within {days} days of delivery. Open <Link to="/orders">Your orders</Link>, find the
            item and choose <strong>Return</strong>. Tell us what went wrong; the seller reviews every request.
          </p>
          <h2>Refunds</h2>
          <ul>
            <li>Paid by card or UPI: the money goes back to the same card or UPI account, usually in 5–7 working days.</li>
            <li>Paid with cash on delivery: give a UPI ID with your return request and we send the refund there.</li>
          </ul>
          <h2>Cancelling an order</h2>
          <p>You can cancel any order that hasn't shipped yet. Paid orders are refunded in full straight away.</p>
          <h2>Something's not right?</h2>
          <p>If a seller declines your return and you disagree, <Link to="/contact">contact us</Link> and we'll look into it.</p>
        </>
      ),
    },
    privacy: {
      title: 'Privacy policy',
      body: (
        <>
          <p className="muted">This is a demo store built as a portfolio project. No real orders are fulfilled.</p>
          <h2>What we collect</h2>
          <p>
            Your name, email address and password (stored only as a secure hash), the delivery addresses you save, and your
            orders, reviews and wishlist. Sellers also share their store, pickup and payout details.
          </p>
          <h2>How we use it</h2>
          <p>
            To process and deliver your orders, send order and account emails, show your reviews, and keep the store safe.
            Sellers see only what they need to ship your order: your name, delivery address and phone number.
          </p>
          <h2>Payments</h2>
          <p>Card and UPI payments are handled by our payment partners (Stripe and Razorpay). We never see or store your full card details.</p>
          <h2>Newsletter</h2>
          <p>We only send offers if you subscribe, and every email has a way to stop them.</p>
          <h2>Your choices</h2>
          <p>You can update your name, password and addresses any time from <Link to="/account">Your account</Link>. To delete your account, <Link to="/contact">contact us</Link>.</p>
        </>
      ),
    },
    terms: {
      title: 'Terms of use',
      body: (
        <>
          <p className="muted">This is a demo store built as a portfolio project. No real orders are fulfilled.</p>
          <h2>Using Shoyo</h2>
          <p>
            Shoyo is a marketplace: products are sold by Shoyo Retail and by independent sellers, shown on each product
            page. Prices and stock can change until you place your order.
          </p>
          <h2>Your account</h2>
          <p>Keep your password private. You're responsible for orders placed from your account.</p>
          <h2>Reviews</h2>
          <p>Only buyers who received a product can review it. Reviews must be honest and must not contain offensive content; we may remove those that don't follow these rules.</p>
          <h2>Selling on Shoyo</h2>
          <p>
            Sellers must list genuine products, describe them accurately, and ship orders promptly. Shoyo keeps a commission
            on each delivered order and may suspend stores that break these rules.
          </p>
          <h2>Returns</h2>
          <p>Our <Link to="/help/returns">returns policy</Link> applies to every order.</p>
        </>
      ),
    },
  };

  const page = pages[topic];
  if (!page) return <NotFoundPage />;

  return (
    <div className="container info-page">
      <nav className="info-nav" aria-label="Help topics">
        {NAV.map(item => <NavLink key={item.topic} to={item.to}>{item.label}</NavLink>)}
        <NavLink to="/contact">Contact us</NavLink>
      </nav>
      <div className="page-header"><h1>{page.title}</h1></div>
      <article className="card info-content">{page.body}</article>
    </div>
  );
}
