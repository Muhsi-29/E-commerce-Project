import { Truck, RotateCcw, Package, Wallet, Star, Clock } from 'lucide-react';
import type { SellerOverview as Overview } from '../../types.ts';
import { formatPrice } from '../../utils/format.ts';
import { formatRate } from '../../utils/seller.ts';
import StarRating from '../../components/StarRating.tsx';

interface SellerOverviewProps {
  overview: Overview;
  onNavigate: (tab: 'products' | 'orders' | 'returns' | 'payouts') => void;
}

// At-a-glance numbers, and the things that need the seller's attention
export default function SellerOverview({ overview, onNavigate }: SellerOverviewProps) {
  const { earnings, products, rating } = overview;
  const live = products.ACTIVE ?? 0;
  const waiting = products.PENDING ?? 0;
  const rejected = products.REJECTED ?? 0;

  const todo = [
    overview.shipmentsToShip > 0 && { tab: 'orders' as const, icon: Truck, text: `${overview.shipmentsToShip} ${overview.shipmentsToShip === 1 ? 'order' : 'orders'} to pack and ship` },
    overview.openReturns > 0 && { tab: 'returns' as const, icon: RotateCcw, text: `${overview.openReturns} return ${overview.openReturns === 1 ? 'request' : 'requests'} to review` },
    rejected > 0 && { tab: 'products' as const, icon: Package, text: `${rejected} ${rejected === 1 ? 'product was' : 'products were'} not approved: edit to resubmit` },
    waiting > 0 && { tab: 'products' as const, icon: Clock, text: `${waiting} ${waiting === 1 ? 'product is' : 'products are'} waiting for approval` },
  ].filter(Boolean) as { tab: 'orders' | 'returns' | 'products'; icon: typeof Truck; text: string }[];

  return (
    <>
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon"><Wallet size={20} /></div>
          <span className="stat-label">Available for payout</span>
          <span className="stat-value">{formatPrice(earnings.available)}</span>
          <span className="stat-hint">{formatPrice(earnings.pending)} more once orders are delivered</span>
        </div>
        <div className="card stat-card">
          <div className="stat-icon"><Wallet size={20} /></div>
          <span className="stat-label">Total earned</span>
          <span className="stat-value">{formatPrice(earnings.earned)}</span>
          <span className="stat-hint">After {formatRate(overview.commissionRate)} commission</span>
        </div>
        <div className="card stat-card">
          <div className="stat-icon"><Package size={20} /></div>
          <span className="stat-label">Live products</span>
          <span className="stat-value">{live}</span>
          <span className="stat-hint">{waiting} waiting for approval</span>
        </div>
        <div className="card stat-card">
          <div className="stat-icon"><Star size={20} /></div>
          <span className="stat-label">Seller rating</span>
          <span className="stat-value">{rating.count > 0 ? rating.average.toFixed(1) : '—'}</span>
          {rating.count > 0 ? <StarRating value={rating.average} count={rating.count} /> : <span className="stat-hint">Buyers rate you after delivery</span>}
        </div>
      </div>

      <div className="card seller-panel">
        <h2>To do</h2>
        {todo.length === 0 ? (
          <p className="muted">You're all caught up. New orders and return requests will show up here.</p>
        ) : (
          <ul className="todo-list">
            {todo.map(item => (
              <li key={item.text}>
                <item.icon size={18} />
                <span>{item.text}</span>
                <button className="btn-link" onClick={() => onNavigate(item.tab)}>Open</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
