import { Link } from 'react-router-dom';
import { useShops } from '../context/ShopsContext';
import ShopCard from '../components/ShopCard';

export default function Home() {
  const { shops, cities, loading } = useShops();
  const featured = shops.filter((s) => !s.placeholder).slice(0, 6);
  const neighborhoods = new Set(shops.map((s) => s.neighborhood).filter(Boolean));
  const brewMethods = new Set(shops.flatMap((s) => s.tags).filter((t) => t && !['light', 'medium', 'dark'].includes(t)));
  const cityCount = (city) => shops.filter((s) => s.city === city).length;

  if (loading) {
    return <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 text-center text-[var(--color-muted-fg)]">Loading shops…</div>;
  }

  return (
    <>
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-14">
        <p className="uppercase tracking-[0.2em] text-xs font-semibold text-[var(--color-accent)] mb-4">
          Your Specialty Coffee Finder
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] max-w-2xl">
          Find Your Perfect Coffee
        </h1>
        <p className="mt-5 text-base sm:text-lg text-[var(--color-muted-fg)] max-w-xl">
          Discover the world's best specialty coffee shops. Filter by roast type, brewing method,
          and ambiance to find your next favorite spot.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/explore"
            className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Explore shops
          </Link>
          <Link
            to="/auth"
            className="px-6 py-3 rounded-xl border border-[var(--color-border)] font-semibold text-sm hover:bg-[var(--color-card)] transition-colors"
          >
            Save favorites
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="font-display text-2xl font-semibold mb-1">Browse by city</h2>
        <p className="text-sm text-[var(--color-muted-fg)] mb-6">
          Pick a city to explore its specialty coffee scene.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {cities.map((city) => (
            <Link
              key={city}
              to={`/explore?city=${encodeURIComponent(city)}`}
              className="group relative rounded-2xl overflow-hidden h-28 flex items-end p-4 border border-[var(--color-border)] hover:shadow-md transition-shadow"
            >
              <img
                src={`/images/cities/${city.toLowerCase()}.jpg`}
                alt={city}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)' }} />
              <div className="relative text-white">
                <p className="font-display font-semibold">{city}</p>
                <p className="text-xs opacity-80">{cityCount(city)} spots</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold mb-1">Featured Shops</h2>
            <p className="text-sm text-[var(--color-muted-fg)]">Top-rated specialty coffee.</p>
          </div>
          <Link to="/explore" className="text-sm font-semibold text-[var(--color-accent)] hover:underline shrink-0">
            View all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-display text-3xl sm:text-4xl font-semibold">{shops.length}</p>
            <p className="text-sm text-[var(--color-muted-fg)] mt-1">Shops listed</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-semibold">{neighborhoods.size}+</p>
            <p className="text-sm text-[var(--color-muted-fg)] mt-1">Neighborhoods</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-semibold">{brewMethods.size}+</p>
            <p className="text-sm text-[var(--color-muted-fg)] mt-1">Brewing methods</p>
          </div>
        </div>
      </section>
    </>
  );
}
