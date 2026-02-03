/**
 * Authentication Context
 * 
 * Provides auth state and methods throughout the app.
 * Uses Magic Link authentication - no passwords needed.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface User {
  id: string;
  email: string;
  name?: string;
  orgId: string;
  orgName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  requestMagicLink: (email: string, name?: string, orgName?: string) => Promise<{ needsSignup?: boolean }>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  }

  async function requestMagicLink(email: string, name?: string, orgName?: string): Promise<{ needsSignup?: boolean }> {
    const res = await fetch(`${API_URL}/api/auth/magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, name, orgName }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      if (data.needsSignup) {
        return { needsSignup: true };
      }
      throw new Error(data.error || "Failed to send magic link");
    }

    return {};
  }

  async function verifyMagicLink(token: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/auth/verify?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Invalid or expired link");
    }

    const data = await res.json();
    setUser(data.user);
  }

  async function logout() {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, requestMagicLink, verifyMagicLink, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Protected route component - redirects to login if not authenticated
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}
