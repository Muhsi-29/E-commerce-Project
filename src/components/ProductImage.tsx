import { useState } from 'react';
import { Package } from 'lucide-react';
import { imageUrl } from '../config.ts';
import type { Product } from '../types.ts';

// A product's image laid over a neat placeholder. The placeholder shows while the image loads,
// and stays visible if the image is missing or fails to load. Once loaded, the image fades in on a
// white background (many product photos are transparent PNG/WebP cut-outs).
export default function ProductImage({ product, className = '' }: { product: Pick<Product, 'image' | 'title' | 'category'>; className?: string }) {
  const src = product.image ? imageUrl(product.image) : '';
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  return (
    <div className={`product-image ${className}`} role="img" aria-label={product.title}>
      <div className="product-image-fallback" aria-hidden="true">
        <Package size={36} strokeWidth={1.5} />
        <span>{product.category}</span>
      </div>
      {src && failedSrc !== src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          className={loadedSrc === src ? 'loaded' : ''}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
}
