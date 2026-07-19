import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShops } from '../context/ShopsContext';

// Rough relative positions per city, just for a stylized placeholder map.
// Swap this out for a real Leaflet/Mapbox/Google Maps integration once you
// have an API key and real lat/lng per shop.
const cityPositions = {
  Munich: { top: '62%', left: '58%' },
  Vienna: { top: '58%', left: '78%' },
  Berlin: { top: '22%', left: '55%' },
  Hamburg: { top: '10%', left: '48%' },
  Zurich: { top: '72%', left: '38%' },
};

export default function MapPage() {
  const { shops, cities } = useShops();
  const [activeCity, setActiveCity] = useState(null);
  const cityShops = activeCity ? shops.filter((s) => s.city === activeCity) : [];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Map</h1>
      <p className="text-[var(--color-muted-fg)] mt-2 max-w-xl">
        A stylized overview of your cities. Individual shop pins need real coordinates —
        this placeholder groups by city until you wire up a maps API key.
      </p>

      <div className="relative mt-8 w-full aspect-[16/10] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        {cities.map((city) => {
          const pos = cityPositions[city];
          const count = shops.filter((s) => s.city === city).length;
          return (
            <button
              key={city}
              onClick={() => setActiveCity(city === activeCity ? null : city)}
              style={{ top: pos.top, left: pos.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            >
              <span
                className={`w-4 h-4 rounded-full border-2 border-[var(--color-fg)] transition-transform group-hover:scale-125 ${
                  activeCity === city ? 'bg-[var(--color-primary)] scale-125' : 'bg-[var(--color-accent)]'
                }`}
              />
              <span className="mt-1 text-xs font-semibold text-[var(--color-fg)] bg-black/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                {city} · {count}
              </span>
            </button>
          );
        })}
      </div>

      {activeCity && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold mb-4">{activeCity} shops</h2>
          <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {cityShops.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <Link to={`/shop/${s.slug}`} className="font-medium hover:text-[var(--color-accent)]">{s.name}</Link>
                  <p className="text-xs text-[var(--color-muted-fg)]">{s.address}</p>
                </div>
                {s.neighborhood && (
                  <span className="text-xs text-[var(--color-accent)] font-medium shrink-0">{s.neighborhood}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
