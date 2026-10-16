// The shopper's delivery PIN code, remembered in this browser (shown in the navbar and on product pages)

const KEY = 'deliveryPincode';
export const PINCODE_EVENT = 'pincode:changed';

export const getPincode = () => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};

export const savePincode = (pincode: string) => {
  try {
    localStorage.setItem(KEY, pincode);
  } catch {
    // Storage unavailable
  }
  window.dispatchEvent(new Event(PINCODE_EVENT));
};

export const isValidPincode = (pincode: string) => /^[1-9][0-9]{5}$/.test(pincode);
