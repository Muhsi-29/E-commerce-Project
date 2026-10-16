import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { api, getErrorMessage } from '../../api.ts';
import type { Earnings, Payout } from '../../types.ts';
import { formatDate, formatPrice } from '../../utils/format.ts';
import { formatRate } from '../../utils/seller.ts';
import PageState from '../../components/PageState.tsx';

interface PayoutData {
  earnings: Earnings;
  payouts: Payout[];
  commissionRate: number;
  payoutUpi: string;
}

// How earnings add up, and the payouts Shoyo has sent
export default function SellerPayouts() {
  const [data, setData] = useState<PayoutData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/seller/payouts').then(res => setData(res.data.data)).catch(err => setError(getErrorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <PageState loading />;

  const { earnings } = data;

  return (
    <div className="seller-payouts">
      <div className="card seller-panel">
        <h2>Earnings</h2>
        <div className="summary-row"><span>Earned from delivered orders</span><span>{formatPrice(earnings.earned)}</span></div>
        <div className="summary-row"><span>Refunded returns</span><span>− {formatPrice(earnings.returns)}</span></div>
        <div className="summary-row"><span>Already paid out</span><span>− {formatPrice(earnings.paidOut)}</span></div>
        <div className="summary-row summary-total"><span>Available for payout</span><span>{formatPrice(earnings.available)}</span></div>
        <p className="muted small">
          {formatPrice(earnings.pending)} from orders on their way is added once they're delivered.
          Earnings are after the {formatRate(data.commissionRate)} Shoyo commission. Payouts go to <strong>{data.payoutUpi}</strong>.
        </p>
      </div>

      <div className="card seller-panel">
        <h2>Payout history</h2>
        {data.payouts.length === 0 ? (
          <PageState icon={<Wallet size={40} strokeWidth={1.5} />} title="No payouts yet" message="Our team sends payouts regularly once you have earnings available." />
        ) : (
          <div className="table-wrap">
            <table className="seller-table">
              <thead><tr><th>Date</th><th>Reference</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {data.payouts.map(p => (
                  <tr key={p.id}>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>{p.reference ?? <span className="muted">—</span>}</td>
                    <td className="num">{formatPrice(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
