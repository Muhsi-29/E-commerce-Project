import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../api.ts';
import { useAuth } from '../context/auth.ts';
import type { Address, ShippingAddress } from '../types.ts';
import { emptyAddress, formatAddress } from '../utils/address.ts';
import AddressForm from '../components/AddressForm.tsx';
import PageState from '../components/PageState.tsx';
import './AccountPages.css';

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<ShippingAddress>(() => emptyAddress(user?.name));
  const [label, setLabel] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    api.get('/addresses').then(res => setAddresses(res.data.data)).catch(err => setMessage({ type: 'error', text: getErrorMessage(err) }));
  }, []);

  const startEdit = (address: Address | null) => {
    setFieldErrors({});
    setMessage(null);
    if (address) {
      const { id, label: addressLabel, isDefault: _isDefault, ...fields } = address;
      setForm(fields);
      setLabel(addressLabel ?? '');
      setEditing(id);
    } else {
      setForm(emptyAddress(user?.name));
      setLabel('');
      setEditing('new');
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const body = { ...form, line2: form.line2 || undefined, label: label || undefined };
    try {
      const res = editing === 'new' ? await api.post('/addresses', body) : await api.put(`/addresses/${editing}`, body);
      setAddresses(res.data.data);
      setEditing(null);
      setMessage({ type: 'success', text: 'Address saved.' });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  };

  const run = async (request: Promise<{ data: { data: Address[] } }>, text: string) => {
    try {
      const res = await request;
      setAddresses(res.data.data);
      setMessage({ type: 'success', text });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setConfirmDelete(null);
    }
  };

  if (!addresses && !message) return <PageState loading />;

  return (
    <div className="container account-page">
      <Link to="/account" className="btn-link back-link"><ArrowLeft size={14} /> Your account</Link>
      <div className="page-header page-header-row">
        <h1>Your addresses</h1>
        {editing === null && <button className="btn btn-primary btn-sm btn-inline" onClick={() => startEdit(null)}><Plus size={16} /> Add address</button>}
      </div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {editing !== null && (
        <form className="card address-editor" onSubmit={save}>
          <h2>{editing === 'new' ? 'New address' : 'Edit address'}</h2>
          <AddressForm value={form} onChange={setForm} errors={fieldErrors} idPrefix="saved" />
          <div className="input-group">
            <label className="input-label" htmlFor="saved-label">Label (optional)</label>
            <input id="saved-label" className="input-field" placeholder="Home, Work..." maxLength={30} value={label} onChange={e => setLabel(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline btn-inline" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-inline">Save address</button>
          </div>
        </form>
      )}

      {addresses?.length === 0 && editing === null && (
        <PageState icon={<MapPin size={44} strokeWidth={1.5} />} title="No saved addresses" message="Save an address here or at checkout to order faster next time." />
      )}

      <ul className="address-list">
        {addresses?.map(address => (
          <li key={address.id} className={`card address-card ${address.isDefault ? 'default' : ''}`}>
            <div className="address-card-head">
              <strong>{address.fullName}</strong>
              {address.label && <span className="address-label">{address.label}</span>}
              {address.isDefault && <span className="badge badge-delivered">Default</span>}
            </div>
            <p>{formatAddress(address)}</p>
            <p className="muted small">Phone: {address.phone}</p>
            <div className="address-card-actions">
              <button className="btn-link" onClick={() => startEdit(address)}><Pencil size={14} /> Edit</button>
              {!address.isDefault && (
                <button className="btn-link" onClick={() => run(api.patch(`/addresses/${address.id}/default`), 'Default address updated.')}>Set as default</button>
              )}
              {confirmDelete === address.id ? (
                <span className="confirm-inline">
                  Delete?
                  <button className="btn btn-danger btn-sm btn-inline" onClick={() => run(api.delete(`/addresses/${address.id}`), 'Address deleted.')}>Yes</button>
                  <button className="btn btn-outline btn-sm btn-inline" onClick={() => setConfirmDelete(null)}>No</button>
                </span>
              ) : (
                <button className="btn-link danger-link" onClick={() => setConfirmDelete(address.id)}><Trash2 size={14} /> Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
