import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, Role } from "./auth.types";
import { fetchMyProfile } from "../lib/profile.service";

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setUser(null);
      setProfile(null);
      return;
    }

    const u = data.user;
    setUser(u ?? null);

    if (!u) {
      setProfile(null);
      return;
    }

    try {
      const p = await fetchMyProfile();
      setProfile(p ?? null);
    } catch {
      setProfile(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;

    // 1) Always restore session on boot (hard reload safe)
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;

        const s = data.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          try {
            const p = await fetchMyProfile();
            if (!alive) return;
            setProfile(p ?? null);
          } catch {
            if (!alive) return;
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // 2) Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!alive) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        try {
          const p = await fetchMyProfile();
          if (!alive) return;
          setProfile(p ?? null);
        } catch {
          if (!alive) return;
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      // important for cases where auth change fires during boot
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      profile,
      role: profile?.role ?? null,
      loading,
      refreshProfile,
      signOut,
    }),
    [session, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
