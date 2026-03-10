import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchMyProfile } from "../lib/profile.service";
import { env } from "../lib/env";
import type { Profile } from "./auth.types";
import { AuthContext, type AuthState } from "./AuthContext";

const APP_BUILD_ID_KEY = "__app_build_id";

function clearPersistedAppKeys() {
  if (typeof window === "undefined") return;

  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith("sb-") || key.startsWith("ysp_")) {
      localStorage.removeItem(key);
    }
  }
}

async function loadProfileWithRetry(userId: string, retries = 1): Promise<Profile | null> {
  try {
    return await fetchMyProfile(userId);
  } catch (error) {
    if (retries <= 0) throw error;
    return loadProfileWithRetry(userId, retries - 1);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  const syncFromSession = useCallback(
    async (nextSession: Session | null, shouldUpdate: () => boolean = () => true) => {
      if (!shouldUpdate()) return;
      setSession(nextSession);

      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      userRef.current = nextUser;

      if (!nextUser) {
        if (shouldUpdate()) setProfile(null);
        return;
      }

      try {
        const p = await loadProfileWithRetry(nextUser.id);
        if (!shouldUpdate()) return;
        setProfile(p ?? null);
      } catch (error) {
        if (!shouldUpdate()) return;
        if (import.meta.env.DEV) {
          console.warn("[AuthProvider] profile sync failed.", error);
        }
        setProfile((prev) => (prev?.id === nextUser.id ? prev : null));
      }
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setUser(null);
      userRef.current = null;
      setProfile(null);
      return;
    }

    const u = data.user;
    setUser(u ?? null);
    userRef.current = u ?? null;

    if (!u) {
      setProfile(null);
      return;
    }

    try {
      const p = await loadProfileWithRetry(u.id);
      setProfile(p ?? null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[AuthProvider] refreshProfile failed.", error);
      }
      setProfile((prev) => (prev?.id === u.id ? prev : null));
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    userRef.current = null;
    setProfile(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (typeof window !== "undefined") {
          const currentBuildId = env.appBuildId;
          const storedBuildId = localStorage.getItem(APP_BUILD_ID_KEY);

          if (storedBuildId !== currentBuildId) {
            try {
              await supabase.auth.signOut();
            } catch {
              // Ignore remote sign-out failures; local cleanup still handles stale state.
            }
            clearPersistedAppKeys();
            localStorage.setItem(APP_BUILD_ID_KEY, currentBuildId);
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        await syncFromSession(data.session ?? null, () => alive);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!alive) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        userRef.current = null;
        setProfile(null);
        setLoading(false);
        return;
      }

      const shouldBlockRoute = event === "SIGNED_IN" && !userRef.current;

      if (shouldBlockRoute) {
        setLoading(true);
      }

      await syncFromSession(nextSession ?? null, () => alive);
      if (alive && shouldBlockRoute) setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [syncFromSession]);

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
    [session, user, profile, loading, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
