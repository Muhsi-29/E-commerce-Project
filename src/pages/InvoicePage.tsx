import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import type { Order } from '../types.ts';
import { formatAddress } from '../utils/address.ts';
import { formatDate, formatPrice } from '../utils/format.ts';
import PageState from '../components/PageState.tsx';
import './InvoicePage.css';

const PAYMENT = { STRIPE: 'Paid online (card)', RAZORPAY: 'Paid online (UPI / card / net banking)', COD: 'Cash on delivery' };

// A printable invoice ("Save as PDF" from the print dialog downloads it)
export default function InvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data.data)).catch(err => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <PageState title="Invoice not available" message={error} />;
  if (!order) return <PageState loading />;

  const sellers = [...new Set(order.shipments.map(s => s.sellerName ?? s.seller?.storeName).filter(Boolean))];

  return (
    <div className="container invoice-page">
      <div className="invoice-toolbar no-print">
        <Link to="/orders" className="btn-link"><ArrowLeft size={14} /> Back to orders</Link>
        <button className="btn btn-primary btn-sm btn-inline" onClick={() => window.print()}><Printer size={16} /> Print / save as PDF</button>
      </div>

      <article className="invoice card">
        <header className="invoice-head">
          <div>
            <h1>Shoyo</h1>
            <p className="muted small">Tax invoice / bill of supply</p>
          </div>
          <div className="invoice-meta">
            <p><span>Invoice for order</span><strong>#{order.id}</strong></p>
            <p><span>Order date</span><strong>{formatDate(order.createdAt)}</strong></p>
            <p><span>Payment</span><strong>{PAYMENT[order.paymentMethod]}</strong></p>
          </div>
        </header>

        <section className="invoice-parties">
          <div>
            <h2>Billed to</h2>
            <p><strong>{order.shippingAddress?.fullName ?? order.user.name}</strong></p>
            <p>{formatAddress(order.shippingAddress)}</p>
            {order.shippingAddress?.phone && <p>Phone: {order.shippingAddress.phone}</p>}
            <p>{order.user.email}</p>
          </div>
          <div>
            <h2>Sold by</h2>
            {sellers.map(name => <p key={name}>{name}</p>)}
          </div>
        </section>

        <table className="invoice-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id}>
                <td>{item.product.title}</td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.price)}</td>
                <td>{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3}>Items total</td><td>{formatPrice(order.subtotal)}</td></tr>
            {order.discount > 0 && <tr><td colSpan={3}>Coupon {order.couponCode}</td><td>-{formatPrice(order.discount)}</td></tr>}
            <tr><td colSpan={3}>Delivery</td><td>{order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : 'Free'}</td></tr>
            <tr className="grand"><td colSpan={3}>Total</td><td>{formatPrice(order.totalAmount)}</td></tr>
            {order.refundedAmount > 0 && <tr><td colSpan={3}>Refunded</td><td>-{formatPrice(order.refundedAmount)}</td></tr>}
          </tfoot>
        </table>

        <p className="invoice-foot muted small">Prices include all applicable taxes. Thank you for shopping with Shoyo!</p>
      </article>
    </div>
  );
}
