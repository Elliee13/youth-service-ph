import { supabase } from "./supabase";
import type { Profile } from "../auth/auth.types";

export async function fetchMyProfile(userId?: string): Promise<Profile | null> {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const userRes = await supabase.auth.getUser();
    if (userRes.error) throw userRes.error;
    resolvedUserId = userRes.data.user?.id;
  }

  if (!resolvedUserId) return null;

  if (import.meta.env.DEV) {
    console.warn("[profile.service] query start.", {
      userId: resolvedUserId,
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, chapter_id, created_at")
    .eq("id", resolvedUserId)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[profile.service] query error.", {
        userId: resolvedUserId,
        error,
      });
    }
    throw error;
  }

  if (import.meta.env.DEV) {
    console.warn("[profile.service] query success.", {
      userId: resolvedUserId,
      profileId: data?.id ?? null,
      role: data?.role ?? null,
      chapterId: data?.chapter_id ?? null,
    });
  }
  return data as Profile | null;
}
