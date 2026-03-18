import { supabase } from "./supabase";

export type ProgramRow = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
};

export type ChapterRow = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

export type OpportunityRow = {
  id: string;
  event_name: string;
  event_date: string; // YYYY-MM-DD
  chapter_id: string;
  approval_status: "pending_approval" | "approved";
  created_by: string | null;
  created_by_label: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sdgs: string[];
  contact_details: string;
  created_at: string;
};

export type OpportunityWriteInput = {
  event_name: string;
  event_date: string;
  chapter_id: string;
  approval_status: "pending_approval" | "approved";
  sdgs: string[];
  contact_details: string;
};

export type SiteSettingsRow = {
  id: boolean;
  projects_count: number;
  chapters_count: number;
  members_count: number;
  contact_email: string;
  contact_facebook: string;
  contact_mobile: string;
  membership_form_url: string | null;
  chapter_proposal_form_url: string | null;
  updated_at: string;
};

export type ChapterHeadStaffRow = {
  id: string;
  email: string | null;
  chapter_id: string | null;
  chapter_name: string | null;
  created_at: string | null;
};

export type VolunteerSignupRow = {
  id: string;
  opportunity_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  created_at: string;
  opportunity: {
    id: string;
    event_name: string;
    event_date: string;
    chapter_id: string;
    chapter: {
      id: string;
      name: string;
    } | null;
  } | null;
};

// ---------------- Programs ----------------
export async function adminListPrograms(): Promise<ProgramRow[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("id, title, description, image_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProgramRow[];
}

export async function adminCreateProgram(input: {
  title: string;
  description: string;
  image_url?: string | null;
}) {
  const { error } = await supabase.from("programs").insert({
    title: input.title,
    description: input.description,
    image_url: input.image_url ?? null,
  });
  if (error) throw error;
}

export async function adminUpdateProgram(id: string, input: Partial<Pick<ProgramRow, "title" | "description" | "image_url">>) {
  const { error } = await supabase.from("programs").update(input).eq("id", id);
  if (error) throw error;
}

export async function adminDeleteProgram(id: string) {
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Chapters ----------------
export async function adminListChapters(): Promise<ChapterRow[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("id, name, description, location, contact_name, contact_email, contact_phone, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChapterRow[];
}

export async function adminCreateChapter(input: Omit<ChapterRow, "id" | "created_at">) {
  const { error } = await supabase.from("chapters").insert(input);
  if (error) throw error;
}

export async function adminUpdateChapter(id: string, input: Partial<Omit<ChapterRow, "id" | "created_at">>) {
  const { error } = await supabase.from("chapters").update(input).eq("id", id);
  if (error) throw error;
}

export async function adminDeleteChapter(id: string) {
  const { error } = await supabase.from("chapters").delete().eq("id", id);
  if (error) throw error;
}

// --------------- Opportunities --------------
export async function listOpportunities(chapterId?: string): Promise<OpportunityRow[]> {
  let q = supabase
    .from("volunteer_opportunities")
    .select(
      "id, event_name, event_date, chapter_id, approval_status, created_by, created_by_label, approved_by, approved_at, sdgs, contact_details, created_at"
    )
    .order("event_date", { ascending: true });

  if (chapterId) q = q.eq("chapter_id", chapterId);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as OpportunityRow[];
}

export async function createOpportunity(input: OpportunityWriteInput) {
  const { error } = await supabase.from("volunteer_opportunities").insert(input);
  if (error) throw error;
}

export async function updateOpportunity(id: string, input: Partial<OpportunityWriteInput>) {
  const { error } = await supabase.from("volunteer_opportunities").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteOpportunity(id: string) {
  const { error } = await supabase.from("volunteer_opportunities").delete().eq("id", id);
  if (error) throw error;
}

// --------------- Site settings --------------
export async function getSiteSettingsRow(): Promise<SiteSettingsRow> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "id, projects_count, chapters_count, members_count, contact_email, contact_facebook, contact_mobile, membership_form_url, chapter_proposal_form_url, updated_at"
    )
    .eq("id", true)
    .single();

  if (error) throw error;
  return data as SiteSettingsRow;
}

export async function updateSiteSettingsRow(input: Partial<Omit<SiteSettingsRow, "id" | "updated_at">>) {
  const { error } = await supabase
    .from("site_settings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
}

type ManageChapterHeadResponse =
  | {
      users: ChapterHeadStaffRow[];
      error?: never;
      ok?: never;
    }
  | {
      ok: true;
      users?: never;
      error?: never;
    }
  | {
      error: string;
      users?: never;
      ok?: never;
    };

function getEdgeErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function getAuthenticatedAccessToken() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(getEdgeErrorMessage(userError, "Failed to verify your session. Please sign in again."));
  }

  if (!user) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const {
    data: { session: initialSession },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(getEdgeErrorMessage(sessionError, "Failed to verify your session. Please sign in again."));
  }

  const now = Math.floor(Date.now() / 1000);
  const isInitialTokenUsable =
    Boolean(initialSession?.access_token) &&
    typeof initialSession?.expires_at === "number" &&
    initialSession.expires_at > now + 30;

  if (isInitialTokenUsable && initialSession?.access_token) {
    return initialSession.access_token;
  }

  const {
    data: { session: refreshedSession },
    error: refreshError,
  } = await supabase.auth.refreshSession();

  if (refreshError) {
    throw new Error(getEdgeErrorMessage(refreshError, "Failed to refresh your session. Please sign in again."));
  }

  const isRefreshedTokenUsable =
    Boolean(refreshedSession?.access_token) &&
    typeof refreshedSession?.expires_at === "number" &&
    refreshedSession.expires_at > now + 30;

  if (!isRefreshedTokenUsable || !refreshedSession?.access_token) {
    throw new Error("Your session expired. Please sign in again.");
  }

  return refreshedSession.access_token;
}

export async function listChapterHeadUsers(): Promise<ChapterHeadStaffRow[]> {
  const accessToken = await getAuthenticatedAccessToken();
  const { data, error } = await supabase.functions.invoke<ManageChapterHeadResponse>(
    "admin-manage-chapter-head",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        action: "list",
      },
    }
  );

  if (error) {
    throw new Error(getEdgeErrorMessage(error, "Failed to load chapter head users."));
  }

  if (!data || "error" in data || !("users" in data) || !Array.isArray(data.users)) {
    throw new Error(data?.error ?? "Failed to load chapter head users.");
  }

  return data.users;
}

export async function createChapterHeadUser(input: {
  email: string;
  password: string;
  chapter_id: string;
}) {
  const accessToken = await getAuthenticatedAccessToken();
  const { data, error } = await supabase.functions.invoke<ManageChapterHeadResponse>(
    "admin-manage-chapter-head",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        action: "create",
        email: input.email,
        password: input.password,
        chapter_id: input.chapter_id,
      },
    }
  );

  if (error) {
    throw new Error(getEdgeErrorMessage(error, "Failed to create chapter head."));
  }

  if (!data || ("error" in data && data.error)) {
    throw new Error(data?.error ?? "Failed to create chapter head.");
  }
}

export async function updateChapterHeadAssignment(input: {
  profile_id: string;
  chapter_id: string;
}) {
  const accessToken = await getAuthenticatedAccessToken();
  const { data, error } = await supabase.functions.invoke<ManageChapterHeadResponse>(
    "admin-manage-chapter-head",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        action: "update",
        profile_id: input.profile_id,
        chapter_id: input.chapter_id,
      },
    }
  );

  if (error) {
    throw new Error(getEdgeErrorMessage(error, "Failed to update chapter head assignment."));
  }

  if (!data || ("error" in data && data.error)) {
    throw new Error(data?.error ?? "Failed to update chapter head assignment.");
  }
}

// --------------- Volunteer signups --------------
export async function listVolunteerSignups(): Promise<VolunteerSignupRow[]> {
  const { data, error } = await supabase
    .from("volunteer_signups")
    .select(
      "id, opportunity_id, user_id, full_name, email, phone, message, created_at, opportunity:volunteer_opportunities!inner(id, event_name, event_date, chapter_id, chapter:chapters(id, name))"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as VolunteerSignupRow[];
}

export async function listVolunteerSignupsByOpportunityIds(
  opportunityIds: string[]
): Promise<VolunteerSignupRow[]> {
  if (opportunityIds.length === 0) return [];

  const { data, error } = await supabase
    .from("volunteer_signups")
    .select(
      "id, opportunity_id, user_id, full_name, email, phone, message, created_at, opportunity:volunteer_opportunities!inner(id, event_name, event_date, chapter_id, chapter:chapters(id, name))"
    )
    .in("opportunity_id", opportunityIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as VolunteerSignupRow[];
}
