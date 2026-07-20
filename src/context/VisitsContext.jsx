import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const VisitsContext = createContext(null);

export function VisitsProvider({ children }) {
  const { user } = useAuth();
  const [visits, setVisits] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setVisits(new Set());
      return;
    }
    api.listVisits()
      .then(({ shops }) => setVisits(new Set(shops.map((s) => s.id))))
      .catch(() => setVisits(new Set()));
  }, [user]);

  const toggleVisit = async (id) => {
    if (!user) return; // caller is responsible for prompting sign-in
    const { visited } = await api.toggleVisit(id);
    setVisits((prev) => {
      const next = new Set(prev);
      if (visited) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const isVisited = (id) => visits.has(id);

  return (
    <VisitsContext.Provider value={{ visits, toggleVisit, isVisited }}>
      {children}
    </VisitsContext.Provider>
  );
}

export function useVisits() {
  const ctx = useContext(VisitsContext);
  if (!ctx) throw new Error('useVisits must be used within VisitsProvider');
  return ctx;
}
