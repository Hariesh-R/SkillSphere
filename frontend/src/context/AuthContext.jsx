/**
 * src/context/AuthContext.jsx
 * Global authentication state — persisted to localStorage.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("ss_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("ss_token") || null);
  const [loading, setLoading] = useState(true);

  // On mount: verify the stored token is still valid
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get("/auth/me");
        const freshUser = data.data.user;
        setUser(freshUser);
        localStorage.setItem("ss_user", JSON.stringify(freshUser));
      } catch {
        // Token invalid/expired — clear storage
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("ss_user", JSON.stringify(userData));
    localStorage.setItem("ss_token", jwtToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ss_user");
    localStorage.removeItem("ss_token");
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("ss_user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
