import type { ShippingAddress } from '../types.ts';
import { INDIAN_STATES } from '../utils/address.ts';

const FIELDS: { name: keyof ShippingAddress; label: string; autoComplete: string; wide?: boolean; optional?: boolean }[] = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name', wide: true },
  { name: 'phone', label: 'Mobile number', autoComplete: 'tel' },
  { name: 'postalCode', label: 'PIN code', autoComplete: 'postal-code' },
  { name: 'line1', label: 'Flat, house no., building, street', autoComplete: 'address-line1', wide: true },
  { name: 'line2', label: 'Area, landmark (optional)', autoComplete: 'address-line2', wide: true, optional: true },
  { name: 'city', label: 'Town / city', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
];

interface AddressFormProps {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
  errors?: Record<string, string>;
  idPrefix?: string;
}

// The fields of an Indian delivery address (no <form> of its own, so it can sit inside other forms)
export default function AddressForm({ value, onChange, errors = {}, idPrefix = 'addr' }: AddressFormProps) {
  return (
    <div className="address-grid">
      {FIELDS.map(field => {
        const id = `${idPrefix}-${field.name}`;
        const error = errors[field.name];
        return (
          <div key={field.name} className={`input-group ${field.wide ? 'wide' : ''}`}>
            <label className="input-label" htmlFor={id}>{field.label}</label>
            <input
              id={id}
              className={`input-field ${error ? 'has-error' : ''}`}
              autoComplete={field.autoComplete}
              list={field.name === 'state' ? `${idPrefix}-states` : undefined}
              inputMode={field.name === 'postalCode' || field.name === 'phone' ? 'numeric' : undefined}
              maxLength={field.name === 'postalCode' ? 6 : undefined}
              value={value[field.name] ?? ''}
              onChange={e => onChange({ ...value, [field.name]: e.target.value })}
              required={!field.optional}
            />
            {error && <span className="field-error">{field.label} {error}</span>}
          </div>
        );
      })}
      <datalist id={`${idPrefix}-states`}>
        {INDIAN_STATES.map(state => <option key={state} value={state} />)}
      </datalist>
    </div>
  );
}
