import { useState, useRef } from 'react';
import { ShopThumb } from './ShopCard';

export default function PhotoGallery({ shop, className = '' }) {
  const images = shop.images?.length > 0 ? shop.images : shop.image ? [shop.image] : [];
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  if (images.length === 0) {
    return <ShopThumb shop={shop} className={className} />;
  }

  const goTo = (i) => setIndex((i + images.length) % images.length);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      goTo(index + (delta < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  };

  return (
    <div
      className={`relative overflow-hidden group ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={images[index]}
        alt={`${shop.name} photo ${index + 1} of ${images.length}`}
        className="w-full h-full object-cover select-none"
        draggable={false}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ‹
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ›
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>

          <span className="absolute top-2 right-2 text-xs font-semibold text-white bg-black/50 px-2 py-0.5 rounded-full">
            {index + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}
