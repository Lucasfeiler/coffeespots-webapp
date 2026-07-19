import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const ShopsContext = createContext(null);

export function ShopsProvider({ children }) {
  const [shops, setShops] = useState([]);
  const [cities, setCities] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.listShops(), api.shopsMeta()])
      .then(([shopsRes, metaRes]) => {
        setShops(shopsRes.shops);
        setCities(metaRes.cities);
        setAllTags(metaRes.allTags);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShopsContext.Provider value={{ shops, cities, allTags, loading, error }}>
      {children}
    </ShopsContext.Provider>
  );
}

export function useShops() {
  const ctx = useContext(ShopsContext);
  if (!ctx) throw new Error('useShops must be used within ShopsProvider');
  return ctx;
}
