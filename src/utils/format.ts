const priceFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

// 79999 -> "₹79,999.00"
export const formatPrice = (amount: number) => priceFormatter.format(amount);

// ISO date -> "16 Oct 2026"
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
