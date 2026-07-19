import { Link } from 'react-router-dom';
import { useShops } from '../context/ShopsContext';
import ShopCard from '../components/ShopCard';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

export default function Favorites() {
  const { user } = useAuth();
  const { shops } = useShops();
  const { favorites } = useFavorites();
  const favShops = shops.filter((s) => favorites.has(s.id));

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 text-center">
        <p className="font-display text-xl mb-2">Sign in to see your favorites</p>
        <p className="text-sm text-[var(--color-muted-fg)] mb-6">
          Favorites are tied to your account so they follow you across devices.
        </p>
        <Link to="/auth" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Your Favorites</h1>
      <p className="text-[var(--color-muted-fg)] mt-2">
        Shops you've saved, synced to your account.
      </p>

      {favShops.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-xl mb-2">No favorites yet</p>
          <p className="text-sm text-[var(--color-muted-fg)] mb-6">
            Tap the heart on any shop to save it here.
          </p>
          <Link to="/explore" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm">
            Explore shops
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {favShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
}
