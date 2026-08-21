import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest, getMe, logout as logoutRequest } from "@/api-client";
import type { User } from "@/api-client";
import { clearToken, getToken, saveToken } from "@/services/storage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const stored = await getToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      setToken(stored);
      try {
        setUser(await getMe());
      } catch {
        await clearToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    signIn: async (identifier, password) => {
      const response = await loginRequest({ identifier, password });
      await saveToken(response.token);
      setToken(response.token);
      setUser(response.user);
    },
    signOut: async () => {
      try {
        await logoutRequest();
      } catch {
        // The session may already be expired; local sign-out should still finish.
      } finally {
        await clearToken();
        setToken(null);
        setUser(null);
      }
    },
    updateUser: (nextUser) => setUser(nextUser),
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}