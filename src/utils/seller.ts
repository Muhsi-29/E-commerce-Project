import type { Seller } from '../types.ts';

// What a seller fills in to apply, and later edits in their store settings
export interface StoreDetails {
  storeName: string;
  description: string;
  phone: string;
  gstin: string;
  payoutUpi: string;
  pickupAddress: { line1: string; city: string; state: string; postalCode: string };
}

export const emptyStoreDetails = (): StoreDetails => ({
  storeName: '', description: '', phone: '', gstin: '', payoutUpi: '',
  pickupAddress: { line1: '', city: '', state: '', postalCode: '' },
});

export const storeDetailsFrom = (seller: Seller): StoreDetails => ({
  storeName: seller.storeName,
  description: seller.description ?? '',
  phone: seller.phone,
  gstin: seller.gstin ?? '',
  payoutUpi: seller.payoutUpi,
  pickupAddress: { ...seller.pickupAddress },
});

// 0.1 -> "10%"
export const formatRate = (rate: number) => `${Math.round(rate * 1000) / 10}%`;
