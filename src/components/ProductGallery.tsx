import { useState } from 'react';
import type { Product } from '../types.ts';
import ProductImage from './ProductImage.tsx';

// Main photo plus thumbnails of the rest of the product's photos
export default function ProductGallery({ product }: { product: Product }) {
  const photos = [product.image, ...product.images];
  const [selected, setSelected] = useState(0);
  const current = photos[selected] ?? product.image;

  return (
    <div className="gallery">
      <div className="gallery-main card">
        <ProductImage product={{ ...product, image: current }} />
      </div>
      {photos.length > 1 && (
        <div className="gallery-thumbs" role="tablist" aria-label="Product photos">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={`Photo ${index + 1}`}
              className={`gallery-thumb ${index === selected ? 'active' : ''}`}
              onClick={() => setSelected(index)}
              onMouseEnter={() => setSelected(index)}
            >
              <ProductImage product={{ ...product, image: photo }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
