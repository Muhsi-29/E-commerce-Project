// The coupon applied on the cart page, carried to checkout (for this browser tab only)

const KEY = 'couponCode';

export const getSavedCoupon = () => {
  try {
    return sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};

export const saveCoupon = (code: string) => {
  try {
    if (code) sessionStorage.setItem(KEY, code);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the shopper can type the code again at checkout
  }
};
