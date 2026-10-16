import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { api, getErrorMessage } from '../../api.ts';
import type { Product, ProductStatus } from '../../types.ts';
import { formatPrice } from '../../utils/format.ts';
import ProductImage from '../../components/ProductImage.tsx';
import ProductForm from '../../components/ProductForm.tsx';
import PageState from '../../components/PageState.tsx';

const STATUS: Record<ProductStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Live', className: 'badge-delivered' },
  PENDING: { label: 'Waiting for approval', className: 'badge-pending' },
  REJECTED: { label: 'Not approved', className: 'badge-cancelled' },
};

interface SellerProductsProps {
  readOnly: boolean; // Suspended stores can look but not change anything
  onChanged: () => void;
}

export default function SellerProducts({ readOnly, onChanged }: SellerProductsProps) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get('/seller/products').then(res => setProducts(res.data.data)).catch(err => setMessage({ type: 'error', text: getErrorMessage(err) }));
    api.get('/products/categories').then(res => setCategories(res.data.data.map((c: { name: string }) => c.name))).catch(() => {});
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter(p =>
      (filter === 'ALL' || p.status === filter) &&
      (!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)));
  }, [products, query, filter]);

  const saved = (product: Product, text?: string) => {
    setProducts(current => {
      const list = current ?? [];
      return list.some(p => p.id === product.id) ? list.map(p => (p.id === product.id ? product : p)) : [product, ...list];
    });
    setEditing(null);
    setMessage({ type: 'success', text: text ?? (product.status === 'PENDING' ? 'Saved. The product goes live once our team approves it.' : 'Product saved.') });
    onChanged();
  };

  const remove = async (id: number) => {
    try {
      const res = await api.delete(`/seller/products/${id}`);
      setProducts(current => current?.filter(p => p.id !== id) ?? null);
      setMessage({ type: 'success', text: res.data.message });
      onChanged();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setConfirmDelete(null);
    }
  };

  if (!products && !message) return <PageState loading />;

  const counts = (status: ProductStatus) => products?.filter(p => p.status === status).length ?? 0;

  return (
    <div className="card seller-panel">
      <div className="panel-heading">
        <h2>Your products</h2>
        <div className="panel-actions">
          <label className="seller-search">
            <Search size={16} />
            <input placeholder="Search your products" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search your products" />
          </label>
          {!readOnly && (
            <button className="btn btn-primary btn-sm btn-inline" onClick={() => setEditing('new')}><Plus size={16} /> Add product</button>
          )}
        </div>
      </div>

      <div className="status-filters">
        {(['ALL', 'ACTIVE', 'PENDING', 'REJECTED'] as const).map(s => (
          <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'ALL' ? `All (${products?.length ?? 0})` : `${STATUS[s].label} (${counts(s)})`}
          </button>
        ))}
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {products?.length === 0 ? (
        <PageState
          icon={<Package size={44} strokeWidth={1.5} />}
          title="No products yet"
          message="Add your first product. Our team checks each new listing before it goes live."
          action={!readOnly && <button className="btn btn-primary btn-inline" onClick={() => setEditing('new')}><Plus size={16} /> Add product</button>}
        />
      ) : (
        <div className="table-wrap">
          <table className="seller-table">
            <thead>
              <tr><th>Product</th><th>Price</th><th>Stock</th><th>Sold</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <div className="table-thumb"><ProductImage product={p} /></div>
                      <div>
                        {p.status === 'ACTIVE' ? <Link to={`/products/${p.id}`}>{p.title}</Link> : <span>{p.title}</span>}
                        <div className="muted small">{[p.brand, p.category].filter(Boolean).join(' · ')}</div>
                        {p.status === 'REJECTED' && p.rejectionReason && <div className="field-error">Reason: {p.rejectionReason}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {formatPrice(p.price)}
                    {p.mrp && p.mrp > p.price && <div className="muted small"><s>{formatPrice(p.mrp)}</s></div>}
                  </td>
                  <td className={p.stock === 0 ? 'stock-out' : p.stock <= 5 ? 'stock-low' : ''}>{p.stock}</td>
                  <td>{p.soldCount}</td>
                  <td><span className={`badge ${STATUS[p.status].className}`}>{STATUS[p.status].label}</span></td>
                  <td className="table-actions">
                    {!readOnly && (confirmDelete === p.id ? (
                      <span className="confirm-inline">
                        Delete?
                        <button className="btn btn-danger btn-sm btn-inline" onClick={() => remove(p.id)}>Yes</button>
                        <button className="btn btn-outline btn-sm btn-inline" onClick={() => setConfirmDelete(null)}>No</button>
                      </span>
                    ) : (
                      <>
                        <button className="icon-btn" onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`} title="Edit"><Pencil size={16} /></button>
                        <button className="icon-btn danger" onClick={() => setConfirmDelete(p.id)} aria-label={`Delete ${p.title}`} title="Delete"><Trash2 size={16} /></button>
                      </>
                    ))}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="muted empty-row">No products match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          endpoint="/seller/products"
          onSaved={saved}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
