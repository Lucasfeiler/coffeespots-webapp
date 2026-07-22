import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
  };

  const register = async (email, password, name) => {
    const { token, user } = await api.register(email, password, name);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const { user } = await api.updateProfile(data);
    setUser(user);
    return user;
  };

  const deleteAccount = async (password) => {
    await api.deleteAccount(password);
    setToken(null);
    setUser(null);
  };

  const uploadPhoto = async (file) => {
    const { user } = await api.uploadPhoto(file);
    setUser(user);
    return user;
  };

  const removePhoto = async () => {
    const { user } = await api.removePhoto();
    setUser(user);
    return user;
  };

  const changeEmail = async (email, password) => {
    const { token, user } = await api.changeEmail(email, password);
    setToken(token);
    setUser(user);
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, deleteAccount, uploadPhoto, removePhoto, changeEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
