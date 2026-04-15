// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { User } from "@/types";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Exposed so Login.tsx can set the user immediately after sign-in (before the
   *  onAuthStateChange event arrives), giving instant navigation with no flicker. */
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch role, name, lastName from the profile table ─────────────────────
  const fetchProfile = async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users_atelier")
      .select(`id, email, name, "lastName", role`)
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[AuthContext] fetchProfile error:", error.message);
      return null;
    }

    if (!data) return null;

    return {
      id:       String(data.id ?? data.email),
      email:    data.email,
      name:     data.name ?? "",
      lastName: data.lastName ?? "",
      role:     (data.role === "admin"
        ? "admin"
        : data.role === "reception"
        ? "reception"
        : "viewer") as User["role"],
    };
  };

  // ── Core auth-state handler ────────────────────────────────────────────────
  //
  // WHY no separate init() / getSession():
  //   Supabase v2 fires INITIAL_SESSION synchronously the moment onAuthStateChange
  //   is registered — that covers the "restore session on mount" case.
  //   Having both a getSession() init AND onAuthStateChange running concurrently
  //   causes them to race each other on every page load.
  //
  // WHY setTimeout(0):
  //   Supabase does NOT await async callbacks. Deferring async work to the next
  //   tick moves it outside Supabase's internal callback context, eliminating
  //   the race condition between concurrent auth events.
  //
  // WHY try / catch / finally:
  //   Guarantees setLoading(false) always runs — even if fetchProfile throws —
  //   so the app never gets permanently stuck on the loading spinner.

  const handleAuthChange = async (session: Session | null) => {
    try {
      if (!session?.user?.email) {
        setUser(null);
        return;
      }

      const profile = await fetchProfile(session.user.email);
      setUser(profile);
    } catch (error) {
      console.error("[AuthContext] handleAuthChange error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        // Defer async work outside Supabase's callback context (see note above)
        setTimeout(() => {
          if (mounted) handleAuthChange(session);
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires SIGNED_OUT → handleAuthChange(null) → clears user
    // but we also clear immediately for instant UI response
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
