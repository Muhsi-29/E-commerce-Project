import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, Store } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import type { StorePageData } from '../types.ts';
import ProductCard from '../components/ProductCard.tsx';
import PageState from '../components/PageState.tsx';
import StarRating from '../components/StarRating.tsx';
import '../components/ProductCard.css';
import './AccountPages.css';

// A seller's public store: who they are, their rating and everything they sell
export default function StorePage() {
  const { slug = '' } = useParams();
  const [store, setStore] = useState<StorePageData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/sellers/${encodeURIComponent(slug)}`)
      .then(res => { if (active) { setStore(res.data.data); setError(''); } })
      .catch(err => { if (active) setError(getErrorMessage(err)); });
    return () => { active = false; };
  }, [slug]);

  if (error) return <PageState icon={<Store size={48} strokeWidth={1.5} />} title="Store not found" message={error} />;
  if (!store || store.slug !== slug) return <PageState loading />;

  return (
    <div className="container">
      <div className="card store-header">
        <div className="store-avatar" aria-hidden="true">{store.storeName.charAt(0).toUpperCase()}</div>
        <div>
          <h1>{store.storeName}</h1>
          {store.description && <p className="muted">{store.description}</p>}
          <div className="store-meta">
            {store.rating.count > 0
              ? <StarRating value={store.rating.average} count={store.rating.count} />
              : <span>No seller ratings yet</span>}
            {store.location && <span><MapPin size={13} /> {store.location}</span>}
            <span><Calendar size={13} /> Selling since {new Date(store.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <h2 className="store-products-title">{store.products.length} {store.products.length === 1 ? 'product' : 'products'}</h2>
      {store.products.length === 0
        ? <PageState title="Nothing for sale right now" message="Check back soon." />
        : <div className="product-grid">{store.products.map(p => <ProductCard key={p.id} product={p} />)}</div>}
    </div>
  );
}
