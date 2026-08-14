import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api";

/* ─────────────────────────────────────────────
   AuthContext
   Single source of truth for the logged-in user.
   Calls GET /api/accounts/me/ once on app mount
   to rehydrate session from the HTTP-only cookie.
───────────────────────────────────────────── */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null  → not yet determined (loading)
  // false → definitely logged out
  // {...} → user object
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Rehydrate session on first mount
  useEffect(() => {
    api
      .get("accounts/me/")
      .then((res) => setUser(res.data ? res.data : false))
      .catch(() => setUser(false))
      .finally(() => setChecking(false));
  }, []);

  /** Call this after a successful login / signup to push user into context */
  const setLoggedIn = useCallback((userData) => {
    setUser(userData);
  }, []);

  /** Call this after a successful logout to clear context */
  const setLoggedOut = useCallback(() => {
    setUser(false);
  }, []);

  const isLoggedIn = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, checking, isLoggedIn, setLoggedIn, setLoggedOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook */
export function useAuth() {
  return useContext(AuthContext);
}
