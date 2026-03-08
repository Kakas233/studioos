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
  /** Auth actions */
  signOut: () => Promise<void>;
  refreshStudio: () => Promise<void>;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchAccountAndStudio = useCallback(
    async (authUser: User) => {
      try {
        // Fetch the account record linked to this auth user
        const { data: accountData } = await supabase
          .from("accounts")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .eq("is_active", true)
          .single();

        if (accountData) {
          setAccount(accountData);

          // Fetch the studio
          if (accountData.studio_id) {
            const { data: studioData } = await supabase
              .from("studios")
              .select("*")
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
    await supabase.auth.signOut();
    setUser(null);
    setAccount(null);
    setStudio(null);
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
    signOut,
    refreshStudio,
    refreshAccount,
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
