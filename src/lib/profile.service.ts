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

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, chapter_id, created_at")
    .eq("id", resolvedUserId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}
