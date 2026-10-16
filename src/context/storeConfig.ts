import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import type { StoreConfig } from '../types.ts';

// Store settings from the backend (payment options, delivery rules...). Fetched once and shared.

const DEFAULTS: StoreConfig = {
  currency: 'INR',
  payments: { stripe: false, razorpay: false, cod: true },
  razorpayKeyId: null,
  delivery: { fee: 40, freeThreshold: 499 },
  returnWindowDays: 7,
  sellerCommissionRate: 0.1,
  platformSellerName: 'Shoyo Retail',
  announcements: [],
};

let request: Promise<StoreConfig> | null = null;

const loadConfig = () => {
  request ??= api.get('/config')
    .then(res => res.data.data as StoreConfig)
    .catch(() => {
      request = null; // Try again next time
      return DEFAULTS;
    });
  return request;
};

export const useStoreConfig = () => {
  const [config, setConfig] = useState<StoreConfig>(DEFAULTS);
  useEffect(() => {
    let active = true;
    loadConfig().then(loaded => { if (active) setConfig(loaded); });
    return () => { active = false; };
  }, []);
  return config;
};

// Delivery charge for an items total, using the store's rules
export const deliveryFeeFor = (subtotal: number, config: StoreConfig) =>
  subtotal <= 0 || subtotal >= config.delivery.freeThreshold ? 0 : config.delivery.fee;

// "UPI, card or cash on delivery", listing only the payment options the store has switched on
export const paymentMethodsText = (config: StoreConfig) => {
  const methods = [config.payments.razorpay && 'UPI', config.payments.stripe && 'card', config.payments.cod && 'cash on delivery']
    .filter((method): method is string => Boolean(method));
  return methods.length > 1 ? `${methods.slice(0, -1).join(', ')} or ${methods[methods.length - 1]}` : methods[0] ?? '';
};
