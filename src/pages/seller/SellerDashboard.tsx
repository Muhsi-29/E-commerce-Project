import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Package, Truck, RotateCcw, Wallet, Settings, ExternalLink, AlertTriangle } from 'lucide-react';
import { api, getErrorMessage } from '../../api.ts';
import { useAuth } from '../../context/auth.ts';
import type { SellerOverview as Overview } from '../../types.ts';
import PageState from '../../components/PageState.tsx';
import SellerOverview from './SellerOverview.tsx';
import SellerProducts from './SellerProducts.tsx';
import SellerOrders from './SellerOrders.tsx';
import SellerReturns from './SellerReturns.tsx';
import SellerPayouts from './SellerPayouts.tsx';
import SellerSettings from './SellerSettings.tsx';
import './SellerDashboard.css';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: Truck },
  { key: 'returns', label: 'Returns', icon: RotateCcw },
  { key: 'payouts', label: 'Payouts', icon: Wallet },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// The seller's back office. Approved (and suspended) stores only; everyone else is sent to /sell.
export default function SellerDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const tab: TabKey = TABS.some(t => t.key === requested) ? (requested as TabKey) : 'overview';
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  const seller = user?.seller;
  const hasStore = seller?.status === 'APPROVED' || seller?.status === 'SUSPENDED';

  // The overview feeds the header and the tab badges; tabs call this after changes so counts stay right
  const refresh = useCallback(() => {
    api.get('/seller/me').then(res => setOverview(res.data.data)).catch(err => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (hasStore) refresh();
  }, [hasStore, refresh]);

  if (!hasStore) return <Navigate to="/sell" replace />;
  if (error && !overview) return <PageState title="Couldn't load your store" message={error} />;
  if (!overview) return <PageState loading />;

  const suspended = overview.seller.status === 'SUSPENDED';
  const badges: Partial<Record<TabKey, number>> = {
    orders: overview.shipmentsToShip,
    returns: overview.openReturns,
    products: overview.products.REJECTED,
  };

  return (
    <div className="container seller-dashboard">
      <div className="page-header page-header-row">
        <div>
          <h1>{overview.seller.storeName}</h1>
          <p>Seller dashboard</p>
        </div>
        {!suspended && (
          <Link to={`/store/${overview.seller.slug}`} className="btn btn-outline btn-sm btn-inline">
            View your store <ExternalLink size={14} />
          </Link>
        )}
      </div>

      {suspended && (
        <div className="alert alert-error seller-alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Your store is suspended.</strong> Your products are hidden and you can't make changes
            {overview.seller.statusReason ? `. Reason: ${overview.seller.statusReason}` : ''}. Contact support to resolve this.
            You can still view your orders and payouts.
          </div>
        </div>
      )}

      <nav className="tabs seller-tabs" aria-label="Seller dashboard sections">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setSearchParams(t.key === 'overview' ? {} : { tab: t.key })}
            aria-current={tab === t.key ? 'page' : undefined}
          >
            <t.icon size={16} /> {t.label}
            {!!badges[t.key] && <span className="tab-count">{badges[t.key]}</span>}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <SellerOverview overview={overview} onNavigate={key => setSearchParams({ tab: key })} />}
      {tab === 'products' && <SellerProducts readOnly={suspended} onChanged={refresh} />}
      {tab === 'orders' && <SellerOrders onChanged={refresh} />}
      {tab === 'returns' && <SellerReturns readOnly={suspended} onChanged={refresh} />}
      {tab === 'payouts' && <SellerPayouts />}
      {tab === 'settings' && <SellerSettings seller={overview.seller} onSaved={refresh} />}
    </div>
  );
}
