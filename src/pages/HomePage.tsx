import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Store } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { paymentMethodsText, useStoreConfig } from '../context/storeConfig.ts';
import type { Category, Product } from '../types.ts';
import { formatPrice } from '../utils/format.ts';
import ProductCard from '../components/ProductCard.tsx';
import ProductRow, { RecentlyViewed } from '../components/ProductRow.tsx';
import HeroCarousel from '../components/HeroCarousel.tsx';
import PageState from '../components/PageState.tsx';
import './HomePage.css';

export default function HomePage() {
  const config = useStoreConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/products', { params: { sort: 'newest', limit: 8 } }),
      api.get('/products/categories'),
      api.get('/products', { params: { sort: 'discount', minDiscount: 10, inStock: true, limit: 10 } }),
    ])
      .then(([productRes, categoryRes, dealRes]) => {
        setProducts(productRes.data.data);
        setCategories(categoryRes.data.data);
        setDeals(dealRes.data.data);
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <HeroCarousel />

      <section className="perks">
        <div className="perk"><Truck size={22} /> Free delivery on orders over {formatPrice(config.delivery.freeThreshold)}</div>
        <div className="perk"><ShieldCheck size={22} /> Pay by {paymentMethodsText(config)}</div>
        <div className="perk"><RotateCcw size={22} /> {config.returnWindowDays}-day easy returns</div>
      </section>

      <div className="container">
        {loading && <PageState loading />}
        {error && <div className="alert alert-error">{error}</div>}

        {categories.length > 0 && (
          <section className="home-section">
            <div className="section-heading">
              <h2>Shop by category</h2>
            </div>
            <div className="category-grid">
              {categories.map(category => (
                <Link key={category.name} to={`/products?category=${encodeURIComponent(category.name)}`} className="category-tile">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.count} {category.count === 1 ? 'product' : 'products'}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <ProductRow title="Top deals" products={deals} autoPlay viewAllTo="/products?sort=discount" />

        {products.length > 0 && (
          <section className="home-section">
            <div className="section-heading">
              <h2>New arrivals</h2>
              <Link to="/products?sort=newest" className="section-link">View all <ArrowRight size={16} /></Link>
            </div>
            <div className="product-grid">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}
        <RecentlyViewed />

        <section className="sell-banner">
          <Store size={36} />
          <div>
            <h2>Sell on Shoyo</h2>
            <p>Reach shoppers across India. Open your store in minutes and get paid straight to your UPI ID.</p>
          </div>
          <Link to="/sell" className="btn btn-accent btn-inline">Start selling <ArrowRight size={18} /></Link>
        </section>
      </div>
    </>
  );
}
