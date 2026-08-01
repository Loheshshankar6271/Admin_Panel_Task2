import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const can = (action) => {
    if (!user) return false;
    const permissions = {
      super_admin: ['view_users', 'manage_users', 'view_orders', 'edit_orders', 'delete_orders', 'view_reports', 'view_settings', 'view_masters', 'manage_masters', 'delete_masters'],
      manager: ['view_orders', 'edit_orders', 'view_reports', 'view_masters', 'manage_masters'],
      staff: ['view_orders'],
    };
    return permissions[user.role]?.includes(action) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
