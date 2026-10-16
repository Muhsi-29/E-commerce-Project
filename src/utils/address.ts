import type { ShippingAddress } from '../types.ts';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const emptyAddress = (fullName = ''): ShippingAddress => ({
  fullName, phone: '', line1: '', line2: '', city: '', state: '', postalCode: '',
});

// One-line version: "12 MG Road, Kochi, Kerala 682001"
export const formatAddress = (a: Partial<ShippingAddress> | null | undefined) =>
  a ? [a.line1, a.line2, a.city, [a.state, a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '';
