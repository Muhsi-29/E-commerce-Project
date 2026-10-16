import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../api.ts';
import { imageUrl } from '../config.ts';
import type { Product, Spec } from '../types.ts';
import ProductImage from './ProductImage.tsx';
import './ProductForm.css';

interface ProductFormProps {
  product: Product | null; // null = creating a new product
  categories: string[];
  endpoint: string; // e.g. "/seller/products"
  onSaved: (product: Product, message?: string) => void;
  onClose: () => void;
}

const MAX_GALLERY = 6;

// Add / edit product dialog. Sent as form-data because it can include image files.
export default function ProductForm({ product, categories, endpoint, onSaved, onClose }: ProductFormProps) {
  const [values, setValues] = useState({
    title: product?.title ?? '',
    brand: product?.brand ?? '',
    price: product ? String(product.price) : '',
    mrp: product?.mrp ? String(product.mrp) : '',
    category: product?.category ?? '',
    stock: product ? String(product.stock) : '',
    description: product?.description ?? '',
  });
  const [specs, setSpecs] = useState<Spec[]>(product?.specs?.length ? product.specs : [{ label: '', value: '' }]);
  const [image, setImage] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Previews of newly chosen files; the temporary URLs are released when replaced or the form closes
  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const galleryUrls = useMemo(() => gallery.map(file => URL.createObjectURL(file)), [gallery]);
  useEffect(() => () => galleryUrls.forEach(url => URL.revokeObjectURL(url)), [galleryUrls]);

  const set = (field: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues(v => ({ ...v, [field]: e.target.value }));

  const setSpec = (index: number, key: keyof Spec, value: string) =>
    setSpecs(rows => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const price = Number(values.price);
  const mrp = Number(values.mrp);
  const discount = values.mrp && mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSaving(true);

    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.append(key, value.trim()); // Empty brand/MRP clears them on edit
    form.append('specs', JSON.stringify(specs.filter(row => row.label.trim() && row.value.trim())));
    if (image) form.append('image', image);
    gallery.forEach(file => form.append('gallery', file));

    try {
      const res = product ? await api.put(`${endpoint}/${product.id}`, form) : await api.post(endpoint, form);
      onSaved(res.data.data, res.data.message);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field] && <span className="field-error">{fieldErrors[field]}</span>;

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal card" onSubmit={submit} aria-label={product ? 'Edit product' : 'Add product'}>
        <div className="modal-header">
          <h2>{product ? `Edit "${product.title}"` : 'Add a product'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <div className="input-group wide">
            <label className="input-label" htmlFor="pf-title">Title</label>
            <input id="pf-title" className="input-field" value={values.title} onChange={set('title')} required maxLength={200} />
            {fieldError('title')}
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="pf-brand">Brand (optional)</label>
            <input id="pf-brand" className="input-field" value={values.brand} onChange={set('brand')} maxLength={60} />
            {fieldError('brand')}
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="pf-category">Category</label>
            <input id="pf-category" className="input-field" list="pf-categories" value={values.category} onChange={set('category')} required maxLength={100} />
            <datalist id="pf-categories">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
            {fieldError('category')}
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="pf-price">Selling price (₹)</label>
            <input id="pf-price" className="input-field" type="number" min="0.01" step="0.01" value={values.price} onChange={set('price')} required />
            {fieldError('price')}
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="pf-mrp">MRP (₹, optional)</label>
            <input id="pf-mrp" className="input-field" type="number" min="0.01" step="0.01" value={values.mrp} onChange={set('mrp')} />
            {discount > 0 && <span className="input-hint">Shown as {discount}% off</span>}
            {fieldError('mrp')}
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="pf-stock">Stock</label>
            <input id="pf-stock" className="input-field" type="number" min="0" step="1" value={values.stock} onChange={set('stock')} required />
            {fieldError('stock')}
          </div>
          <div className="input-group wide">
            <label className="input-label" htmlFor="pf-description">Description</label>
            <textarea id="pf-description" className="input-field" rows={4} value={values.description} onChange={set('description')} required maxLength={5000} />
            {fieldError('description')}
          </div>

          <div className="input-group wide">
            <span className="input-label">Specifications (optional)</span>
            <div className="spec-rows">
              {specs.map((row, i) => (
                <div key={i} className="spec-row">
                  <input className="input-field" placeholder="e.g. Material" value={row.label} onChange={e => setSpec(i, 'label', e.target.value)} maxLength={50} aria-label={`Specification ${i + 1} name`} />
                  <input className="input-field" placeholder="e.g. 100% cotton" value={row.value} onChange={e => setSpec(i, 'value', e.target.value)} maxLength={200} aria-label={`Specification ${i + 1} value`} />
                  <button type="button" className="icon-btn danger" onClick={() => setSpecs(rows => rows.filter((_, j) => j !== i))} aria-label="Remove row"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            {specs.length < 20 && (
              <button type="button" className="btn-link add-row" onClick={() => setSpecs(rows => [...rows, { label: '', value: '' }])}><Plus size={14} /> Add a row</button>
            )}
            {fieldError('specs')}
          </div>

          <div className="input-group wide">
            <label className="input-label" htmlFor="pf-image">
              Main image {product ? '(leave empty to keep the current one)' : ''}
            </label>
            <div className="image-picker">
              {product && !image && <div className="image-preview"><ProductImage product={product} /></div>}
              {previewUrl && <div className="image-preview"><img src={previewUrl} alt="New main" /></div>}
              <input
                id="pf-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={e => setImage(e.target.files?.[0] ?? null)} required={!product}
              />
            </div>
            <span className="input-hint">JPEG, PNG, WebP or GIF, up to 5 MB.</span>
            {fieldError('image')}
          </div>

          <div className="input-group wide">
            <label className="input-label" htmlFor="pf-gallery">
              More photos (up to {MAX_GALLERY}{product?.images.length ? '; choosing new ones replaces the current set' : ''})
            </label>
            <div className="image-picker">
              {gallery.length === 0 && product?.images.map(src => (
                <div key={src} className="image-preview"><img src={imageUrl(src)} alt="" /></div>
              ))}
              {galleryUrls.map(url => <div key={url} className="image-preview"><img src={url} alt="" /></div>)}
            </div>
            <input
              id="pf-gallery" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > MAX_GALLERY) setError(`You can add up to ${MAX_GALLERY} extra photos; only the first ${MAX_GALLERY} were kept.`);
                setGallery(files.slice(0, MAX_GALLERY));
              }}
            />
            {fieldError('gallery')}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-inline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-inline" disabled={saving}>
            {saving ? 'Saving...' : product ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  );
}
