import { formatPrice } from '../utils/format.ts';

// ₹79,999  ₹89,900  11% off
export default function PriceTag({ price, mrp, size = 'md' }: { price: number; mrp: number | null; size?: 'md' | 'lg' }) {
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <div className={`price-tag price-tag-${size}`}>
      <span className="price-now">{formatPrice(price)}</span>
      {discount > 0 && (
        <>
          <span className="price-mrp" aria-label={`MRP ${formatPrice(mrp!)}`}>{formatPrice(mrp!)}</span>
          <span className="price-off">{discount}% off</span>
        </>
      )}
    </div>
  );
}
