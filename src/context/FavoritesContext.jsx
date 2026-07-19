import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    api.listFavorites()
      .then(({ shops }) => setFavorites(new Set(shops.map((s) => s.id))))
      .catch(() => setFavorites(new Set()));
  }, [user]);

  const toggleFavorite = async (id) => {
    if (!user) return; // caller is responsible for prompting sign-in
    const { favorited } = await api.toggleFavorite(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const isFavorite = (id) => favorites.has(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
