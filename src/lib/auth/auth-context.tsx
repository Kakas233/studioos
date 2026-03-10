"use client";

/**
 * Unified Auth Context — replaces BOTH Base44 auth contexts (fixes #4).
 * Uses Supabase Auth with httpOnly cookies (fixes #1 — no more localStorage tokens).
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Studio = Database["public"]["Tables"]["studios"]["Row"];

interface LoginResult {
  success: boolean;
  error?: string;
  studio?: Studio | null;
}

interface AuthState {
  /** Supabase auth user (from httpOnly cookie session) */
  user: User | null;
  /** App-level account record */
  account: Account | null;
  /** Current studio */
  studio: Studio | null;
  /** Whether auth is still loading */
  loading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** User role shortcuts */
  role: UserRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isModel: boolean;
  isAccountant: boolean;
  isSuperAdmin: boolean;
  /** Whether this is a read-only support session */
  isReadOnly: boolean;
  /** Whether this is a support impersonation session */
  isSupportSession: boolean;
  /** Auth actions */
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshStudio: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateAccountLocal: (updates: Partial<Account>) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/** Race a promise-like against a timeout. Returns undefined on timeout. */
function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupportSession] = useState(false);

  const supabase = createClient();

  const fetchAccountAndStudio = useCallback(
    async (authUser: User) => {
      try {
        // Fetch account with 8s timeout
        const accountResult = await withTimeout(
          Promise.resolve(
            supabase
              .from("accounts")
              .select("*")
              .eq("auth_user_id", authUser.id)
              .eq("is_active", true)
              .single()
          ),
          8000
        );

        if (!accountResult) {
          console.error("Timeout fetching account");
          return;
        }

        const { data: accountData, error: accountError } = accountResult;

        if (accountError) {
          console.error("Failed to fetch account:", accountError.message, accountError.details, accountError.hint);
          return;
        }

        if (!accountData) return;

        setAccount(accountData);

        // Fetch studio with 8s timeout
        if (accountData.studio_id) {
          const studioResult = await withTimeout(
            Promise.resolve(
              supabase
                .from("studios")
                .select("*")
                .eq("id", accountData.studio_id)
                .single()
            ),
            8000
          );

          if (!studioResult) {
            console.error("Timeout fetching studio");
            return;
          }

          const { data: studioData, error: studioError } = studioResult;

          if (studioError) {
            console.error("Failed to fetch studio:", studioError.message, studioError.details, studioError.hint);
          }
          if (studioData) setStudio(studioData);
        }
      } catch (error) {
        console.error("Error fetching account/studio:", error);
      }
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get the authenticated user with 8s timeout
        const userResult = await withTimeout(
          supabase.auth.getUser(),
          8000
        );

        if (!mounted) return;

        if (!userResult) {
          console.error("Timeout getting auth user");
          setLoading(false);
          return;
        }

        const { data: { user: authUser }, error: userError } = userResult;

        if (userError) {
          console.error("Auth getUser error:", userError.message);
        }

        if (authUser) {
          setUser(authUser);
          await fetchAccountAndStudio(authUser);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Safety net: force loading=false after 12 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setLoading((prev) => {
          if (prev) console.error("Auth safety timeout — forcing loading=false");
          return false;
        });
      }
    }, 12000);

    // Listen for auth state changes (don't block on fetchAccountAndStudio here)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        // Fire and forget — don't await to avoid blocking
        fetchAccountAndStudio(session.user).catch(console.error);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAccount(null);
        setStudio(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [supabase, fetchAccountAndStudio]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors — we're logging out anyway
    }
    setUser(null);
    setAccount(null);
    setStudio(null);
    window.location.href = "/sign-in";
  }, [supabase]);

  const refreshStudio = useCallback(async () => {
    if (!account?.studio_id) return;
    const { data } = await supabase
      .from("studios")
      .select("*")
      .eq("id", account.studio_id)
      .single();
    if (data) setStudio(data);
  }, [supabase, account?.studio_id]);

  const refreshAccount = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();
    if (data) setAccount(data);
  }, [supabase, user]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || "Login failed" };
      }

      return { success: true };
    },
    [supabase]
  );

  const checkSession = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser(authUser);
        await fetchAccountAndStudio(authUser);
      } else {
        setUser(null);
        setAccount(null);
        setStudio(null);
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  }, [supabase, fetchAccountAndStudio]);

  const updateAccountLocal = useCallback((updates: Partial<Account>) => {
    setAccount((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const role = account?.role ?? null;

  const value: AuthState = {
    user,
    account,
    studio,
    loading,
    isAuthenticated: !!user && !!account,
    role,
    isOwner: role === "owner",
    isAdmin: role === "admin" || role === "owner",
    isOperator: role === "operator",
    isModel: role === "model",
    isAccountant: role === "accountant",
    isSuperAdmin: account?.is_super_admin ?? false,
    isReadOnly: false,
    isSupportSession,
    login,
    logout: signOut,
    signOut,
    refreshStudio,
    refreshAccount,
    checkSession,
    updateAccountLocal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
