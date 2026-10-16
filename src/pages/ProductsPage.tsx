import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import type { Category, ProductPage } from '../types.ts';
import ProductCard from '../components/ProductCard.tsx';
import Pagination from '../components/Pagination.tsx';
import PageState from '../components/PageState.tsx';
import './ProductsPage.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Customer rating' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

const RATING_OPTIONS = [4, 3, 2];
const DISCOUNT_OPTIONS = [50, 30, 20, 10];
const PAGE_SIZE = 12;

// Search, filter, sort and paginate. All filters live in the URL (?q=&category=&brand=&sort=...),
// so results can be bookmarked or shared and the back button works.
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const minRating = searchParams.get('minRating') ?? '';
  const minDiscount = searchParams.get('minDiscount') ?? '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const selectedBrands = brand ? brand.split(',') : [];

  const [result, setResult] = useState<ProductPage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceInputs, setPriceInputs] = useState({ min: minPrice, max: maxPrice });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    api.get('/products/categories').then(res => setCategories(res.data.data)).catch(() => {});
  }, []);

  // Keep the price boxes in sync when the URL changes (e.g. back button)
  useEffect(() => {
    setPriceInputs({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = { q, category, brand, minPrice, maxPrice, minRating, minDiscount, inStock: inStock ? 'true' : '', sort, page, limit: PAGE_SIZE };
    api.get('/products', { params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '')) })
      .then(res => { if (!cancelled) setResult(res.data); })
      .catch(err => { if (!cancelled) setError(getErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, category, brand, minPrice, maxPrice, minRating, minDiscount, inStock, sort, page]);

  // Change some filters; any change other than the page goes back to page 1
  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next);
  };

  const toggleBrand = (name: string) => {
    const next = selectedBrands.includes(name) ? selectedBrands.filter(b => b !== name) : [...selectedBrands, name];
    updateParams({ brand: next.join(',') });
  };

  const applyPrice = (e: FormEvent) => {
    e.preventDefault();
    updateParams({ minPrice: priceInputs.min, maxPrice: priceInputs.max });
  };

  const changePage = (newPage: number) => {
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = Boolean(q || category || brand || minPrice || maxPrice || minRating || minDiscount || inStock);
  const title = q ? `Results for "${q}"` : category || 'All products';
  const brands = result?.facets?.brands ?? [];

  return (
    <div className="container products-page">
      <div className="products-toolbar">
        <h1>{title}</h1>
        {result && <p className="products-count">{result.total} {result.total === 1 ? 'product' : 'products'}</p>}
      </div>

      {/* Quick filters, next to the sort order */}
      <div className="filter-bar card">
        <form className="bar-price" onSubmit={applyPrice}>
          <span className="bar-label">Price (₹)</span>
          <input
            className="input-field" type="number" min="0" placeholder="Min" aria-label="Minimum price"
            value={priceInputs.min} onChange={e => setPriceInputs(p => ({ ...p, min: e.target.value }))}
          />
          <span className="muted">to</span>
          <input
            className="input-field" type="number" min="0" placeholder="Max" aria-label="Maximum price"
            value={priceInputs.max} onChange={e => setPriceInputs(p => ({ ...p, max: e.target.value }))}
          />
          <button type="submit" className="btn btn-primary btn-sm btn-inline">Apply</button>
        </form>

        <label className="bar-select">
          <span className="bar-label">Rating</span>
          <select className="input-field" value={minRating} onChange={e => updateParams({ minRating: e.target.value })}>
            <option value="">Any</option>
            {RATING_OPTIONS.map(r => <option key={r} value={r}>{r}★ & above</option>)}
          </select>
        </label>

        <label className="bar-select">
          <span className="bar-label">Discount</span>
          <select className="input-field" value={minDiscount} onChange={e => updateParams({ minDiscount: e.target.value })}>
            <option value="">Any</option>
            {DISCOUNT_OPTIONS.map(d => <option key={d} value={d}>{d}% or more</option>)}
          </select>
        </label>

        <label className="bar-check">
          <input type="checkbox" checked={inStock} onChange={() => updateParams({ inStock: inStock ? '' : 'true' })} />
          In stock only
        </label>

        {hasFilters && (
          <button className="btn-link bar-clear" onClick={() => setSearchParams(sort === 'newest' ? {} : { sort })}>
            <X size={14} /> Clear all
          </button>
        )}

        <div className="bar-end">
          <button className="btn btn-outline btn-sm btn-inline filters-toggle" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen}>
            <SlidersHorizontal size={16} /> More filters
          </button>
          <label className="sort-label">
            <span className="bar-label">Sort by</span>
            <select className="input-field" value={sort} onChange={e => updateParams({ sort: e.target.value })}>
              {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {result?.fuzzy && (
        <div className="alert alert-info">No exact matches for "{q}". Showing close matches instead.</div>
      )}

      <div className="products-layout">
        <aside className={`filters card ${filtersOpen ? 'open' : ''}`}>
          <div className="filter-group">
            <h3>Category</h3>
            <button className={`filter-option ${!category ? 'active' : ''}`} onClick={() => updateParams({ category: '', brand: '' })}>
              All categories
            </button>
            {categories.map(c => (
              <button
                key={c.name}
                className={`filter-option ${category.toLowerCase() === c.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => { updateParams({ category: c.name, brand: '' }); setFiltersOpen(false); }}
              >
                {c.name} <span>{c.count}</span>
              </button>
            ))}
          </div>

          {brands.length > 0 && (
            <div className="filter-group">
              <h3>Brand</h3>
              {brands.map(b => (
                <label key={b.name} className="filter-check">
                  <input type="checkbox" checked={selectedBrands.some(s => s.toLowerCase() === b.name.toLowerCase())} onChange={() => toggleBrand(b.name)} />
                  {b.name} <span>{b.count}</span>
                </label>
              ))}
            </div>
          )}
        </aside>

        <section className="products-results">
          {error && <div className="alert alert-error">{error}</div>}
          {loading && !result && <PageState loading />}
          {result && result.data.length === 0 && !loading && (
            <PageState
              icon={<PackageSearch size={48} />}
              title="No products found"
              message={q && category ? `Nothing matches "${q}" in ${category}.` : 'Try a different search, or clear the filters.'}
              action={q && category && (
                <button className="btn btn-outline btn-inline" onClick={() => updateParams({ category: '' })}>
                  Search all categories
                </button>
              )}
            />
          )}
          {result && result.data.length > 0 && (
            <div className={loading ? 'results-loading' : ''}>
              <div className="product-grid">
                {result.data.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} onChange={changePage} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
