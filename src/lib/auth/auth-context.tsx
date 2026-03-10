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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupportSession, setIsSupportSession] = useState(false);

  const supabase = createClient();

  const fetchAccountAndStudio = useCallback(
    async (authUser: User) => {
      try {
        // Fetch the account record linked to this auth user
        const { data: accountData } = await supabase
          .from("accounts")
          .select("id, auth_user_id, studio_id, email, first_name, last_name, role, is_active, is_super_admin, cut_percentage, operator_cut_percentage, weekly_goal_hours, weekly_goal_enabled, works_alone, onboarding_completed_steps, onboarding_dismissed, payout_method, created_at, updated_at")
          .eq("auth_user_id", authUser.id)
          .eq("is_active", true)
          .single();

        if (accountData) {
          setAccount(accountData);

          // Fetch the studio
          if (accountData.studio_id) {
            const { data: studioData } = await supabase
              .from("studios")
              .select("id, name, subdomain, timezone, primary_currency, secondary_currency, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, model_limit, current_model_count, grace_period_ends_at, trial_ends_at, onboarding_completed, logo_url, payout_frequency, exchange_rate_mode, manual_exchange_rate, created_by, created_at, updated_at")
              .eq("id", accountData.studio_id)
              .single();

            setStudio(studioData);
          }
        }
      } catch (error) {
        console.error("Error fetching account/studio:", error);
      }
    },
    [supabase]
  );

  useEffect(() => {
    // Check initial auth state
    const initAuth = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser(authUser);
          await fetchAccountAndStudio(authUser);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await fetchAccountAndStudio(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAccount(null);
        setStudio(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchAccountAndStudio]);

  const signOut = useCallback(async () => {
    try {
      // Sign out on the client
      await supabase.auth.signOut();
      // Also sign out on the server to clear httpOnly cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors — we're logging out anyway
    }
    setUser(null);
    setAccount(null);
    setStudio(null);
    // Hard redirect to ensure middleware sees the cleared session
    window.location.href = "/sign-in";
  }, [supabase]);

  const refreshStudio = useCallback(async () => {
    if (!account?.studio_id) return;
    const { data } = await supabase
      .from("studios")
      .select("id, name, subdomain, timezone, primary_currency, secondary_currency, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, model_limit, current_model_count, grace_period_ends_at, trial_ends_at, onboarding_completed, logo_url, payout_frequency, exchange_rate_mode, manual_exchange_rate, created_by, created_at, updated_at")
      .eq("id", account.studio_id)
      .single();
    if (data) setStudio(data);
  }, [supabase, account?.studio_id]);

  const refreshAccount = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("accounts")
      .select("id, auth_user_id, studio_id, email, first_name, last_name, role, is_active, is_super_admin, cut_percentage, operator_cut_percentage, weekly_goal_hours, weekly_goal_enabled, works_alone, onboarding_completed_steps, onboarding_dismissed, payout_method, created_at, updated_at")
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

      setUser(data.user);
      await fetchAccountAndStudio(data.user);

      // Check if the user has an active account
      const { data: accountData } = await supabase
        .from("accounts")
        .select("*, studios(*)")
        .eq("auth_user_id", data.user.id)
        .eq("is_active", true)
        .single();

      if (!accountData) {
        // No active account — sign out and return error
        await supabase.auth.signOut();
        setUser(null);
        setAccount(null);
        setStudio(null);
        return { success: false, error: "No active account found for this user" };
      }

      const studioData = accountData?.studios as unknown as Studio | null;
      return { success: true, studio: studioData ?? null };
    },
    [supabase, fetchAccountAndStudio]
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
    isReadOnly: false, // Will be set by impersonation logic
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
