import { supabase } from "./supabase";
import type { Profile } from "../auth/auth.types";

export async function fetchMyProfile(): Promise<Profile | null> {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, chapter_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}
