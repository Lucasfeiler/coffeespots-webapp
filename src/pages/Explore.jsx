import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShops } from '../context/ShopsContext';
import ShopCard from '../components/ShopCard';

export default function Explore() {
  const { shops, cities, allTags, loading } = useShops();
  const [params, setParams] = useSearchParams();
  const cityParam = params.get('city') || '';
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [openNow, setOpenNow] = useState(false);

  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];

  const filtered = useMemo(() => {
    return shops.filter((s) => {
      if (cityParam && s.city !== cityParam) return false;
      if (activeTag && !s.tags.includes(activeTag)) return false;
      if (query && !`${s.name} ${s.neighborhood} ${s.address}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (openNow && !(s.hours && s.hours[todayKey])) return false;
      return true;
    });
  }, [shops, cityParam, activeTag, query, openNow, todayKey]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 text-center text-[var(--color-muted-fg)]">Loading shops…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Explore the Coffee Scene</h1>
      <p className="text-[var(--color-muted-fg)] mt-2">Find your perfect specialty coffee shop.</p>

      <div className="mt-6 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search by name or neighborhood…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-96 px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOpenNow((v) => !v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              openNow
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-card)]'
            }`}
          >
            Open now
          </button>

          <select
            value={cityParam}
            onChange={(e) => {
              const v = e.target.value;
              setParams(v ? { city: v } : {});
            }}
            className="px-4 py-1.5 rounded-full text-sm font-medium border border-[var(--color-border)] bg-[var(--color-card)] focus:outline-none"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={activeTag}
            onChange={(e) => setActiveTag(e.target.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium border border-[var(--color-border)] bg-[var(--color-card)] focus:outline-none"
          >
            <option value="">All filters</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted-fg)]">{filtered.length} shops found</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {filtered.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-[var(--color-muted-fg)]">
          <p className="font-display text-xl mb-2">No shops match those filters</p>
          <p className="text-sm">Try clearing a filter or searching something broader.</p>
        </div>
      )}
    </div>
  );
}
