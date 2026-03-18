import { supabase } from "./supabase";

export type NotificationType =
  | "application_received"
  | "new_opportunity_application"
  | "opportunity_approval_required"
  | "opportunity_approved"
  | "announcement_member"
  | "announcement_chapter_head"
  | "announcement_all";

export type NotificationRow = {
  id: string;
  recipient_user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  actor_user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
};

export type AnnouncementAudience = "member" | "chapter_head" | "both";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export async function listMyNotifications(limit = 20): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, recipient_user_id, type, title, message, link, is_read, read_at, created_at, actor_user_id, entity_type, entity_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function countMyUnreadNotifications(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_read", false);

  if (error) throw error;
}

export async function createAnnouncement(input: {
  title: string;
  message: string;
  audience: AnnouncementAudience;
  link?: string | null;
}): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(getErrorMessage(userError, "Failed to verify your session. Please sign in again."));
  }

  if (!user) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const { error } = await supabase.from("announcements").insert({
    title: input.title,
    message: input.message,
    audience: input.audience,
    link: input.link ?? null,
    is_active: true,
    created_by: user.id,
  });

  if (error) throw error;
}
