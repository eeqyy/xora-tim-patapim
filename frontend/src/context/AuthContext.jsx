// ============================================================
// XORA — Auth Context & State Provider
// frontend/src/context/AuthContext.jsx
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, tokenStorage } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = tokenStorage.get();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authApi.getMe(storedToken);
        if (isMounted) {
          if (response?.data?.user) {
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            tokenStorage.clear();
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        // If 401 or invalid, clear token
        if (isMounted) {
          tokenStorage.clear();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const receivedToken = res?.data?.token;
    const receivedUser = res?.data?.user;

    if (receivedToken) {
      tokenStorage.set(receivedToken);
      setToken(receivedToken);
    }
    if (receivedUser) {
      setUser(receivedUser);
    }
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    return res;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = tokenStorage.get();
    if (!activeToken) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      const res = await authApi.getMe(activeToken);
      if (res?.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
      }
    }
    return null;
  }, [logout]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
