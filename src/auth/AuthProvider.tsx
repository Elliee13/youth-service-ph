import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchMyProfile } from "../lib/profile.service";
import { env } from "../lib/env";
import { withTimeout } from "../lib/async";
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadProfileWithRetry(userId: string, retries = 1): Promise<Profile | null> {
  try {
    if (import.meta.env.DEV) {
      console.warn("[AuthProvider] profile fetch attempt.", { userId, retriesRemaining: retries });
    }
    const profile = await withTimeout(fetchMyProfile(userId), 15000, "Profile fetch timed out.");
    if (import.meta.env.DEV) {
      console.warn("[AuthProvider] profile fetch success.", {
        userId,
        profileId: profile?.id ?? null,
        role: profile?.role ?? null,
        chapterId: profile?.chapter_id ?? null,
      });
    }
    return profile;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[AuthProvider] profile fetch retry.", {
        userId,
        retriesRemaining: retries,
        error,
      });
    }
    if (retries <= 0) {
      if (import.meta.env.DEV) {
        console.warn("[AuthProvider] profile fetch final failure.", { userId, error });
      }
      throw error;
    }
    await wait(500);
    return loadProfileWithRetry(userId, retries - 1);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileRecovering, setProfileRecovering] = useState(false);
  const userRef = useRef<User | null>(null);

  const syncFromSession = useCallback(
    async (nextSession: Session | null, shouldUpdate: () => boolean = () => true) => {
      if (!shouldUpdate()) return;
      setSession(nextSession);

      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      userRef.current = nextUser;

      if (!nextUser) {
        if (shouldUpdate()) {
          setProfile(null);
          setProfileRecovering(false);
        }
        return;
      }

      if (shouldUpdate()) {
        setProfile((prev) => {
          const nextProfile = prev?.id === nextUser.id ? prev : null;
          if (import.meta.env.DEV) {
            console.warn("[AuthProvider] syncFromSession session restored.", {
              userId: nextUser.id,
              preservedProfile: Boolean(nextProfile),
            });
          }
          return nextProfile;
        });
        setProfileRecovering(true);
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
      setProfileRecovering(false);
      return;
    }

    const u = data.user;
    setUser(u ?? null);
    userRef.current = u ?? null;

    if (!u) {
      setProfile(null);
      setProfileRecovering(false);
      return;
    }

    setProfileRecovering(true);
    try {
      const p = await loadProfileWithRetry(u.id);
      setProfile(p ?? null);
      setProfileRecovering(false);
      if (import.meta.env.DEV) {
        console.warn("[AuthProvider] refreshProfile final profile result.", {
          userId: u.id,
          profileId: p?.id ?? null,
          role: p?.role ?? null,
          chapterId: p?.chapter_id ?? null,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[AuthProvider] refreshProfile failed.", error);
        console.warn("[AuthProvider] preserving previous profile fallback.", {
          userId: u.id,
        });
      }
      setProfile((prev) => {
        const nextProfile = prev?.id === u.id ? prev : null;
        if (import.meta.env.DEV) {
          console.warn("[AuthProvider] refreshProfile final profile result.", {
            userId: u.id,
            profileId: nextProfile?.id ?? null,
            role: nextProfile?.role ?? null,
            chapterId: nextProfile?.chapter_id ?? null,
            fallbackUsed: Boolean(nextProfile),
          });
        }
        return nextProfile;
      });
      setProfileRecovering(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    userRef.current = null;
    setProfile(null);
    setProfileRecovering(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (typeof window !== "undefined") {
          const currentBuildId = env.appBuildId;
          const storedBuildId = localStorage.getItem(APP_BUILD_ID_KEY);
          if (import.meta.env.DEV) {
            console.warn("[AuthProvider] bootstrap build ids.", {
              currentBuildId,
              storedBuildId,
            });
          }

          if (storedBuildId !== currentBuildId) {
            if (import.meta.env.DEV) {
              console.warn("[AuthProvider] running build-id invalidation.");
            }
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
        if (import.meta.env.DEV) {
          console.warn("[AuthProvider] bootstrap session resolved.", {
            hasSession: Boolean(data.session),
            userId: data.session?.user?.id ?? null,
          });
        }
        if (!alive) return;
        await syncFromSession(data.session ?? null, () => alive);
        if (alive && data.session?.user) {
          void refreshProfile().catch(() => undefined);
        }
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
        setProfileRecovering(false);
        setLoading(false);
        return;
      }

      const shouldBlockRoute = event === "SIGNED_IN" && !userRef.current;

      if (shouldBlockRoute) {
        setLoading(true);
      }

      await syncFromSession(nextSession ?? null, () => alive);
      if (alive && nextSession?.user) {
        void refreshProfile().catch(() => undefined);
      }
      if (alive && shouldBlockRoute) setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshProfile, syncFromSession]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      profile,
      role: profile?.role ?? null,
      loading,
      profileRecovering,
      refreshProfile,
      signOut,
    }),
    [session, user, profile, loading, profileRecovering, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
