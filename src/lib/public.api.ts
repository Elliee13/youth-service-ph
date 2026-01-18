import { supabase } from "./supabase";

export type SiteSettings = {
  projects_count: number;
  chapters_count: number;
  members_count: number;
  contact_email: string;
  contact_facebook: string;
  contact_mobile: string;
};

export type Program = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
};

export type Chapter = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

export type VolunteerOpportunity = {
  id: string;
  event_name: string;
  event_date: string;
  sdgs: string[];
  contact_details: string;
  created_at: string;
  chapter: { id: string; name: string } | null;
};

export type PublicUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

function logAndThrow(scope: string, error: any) {
  console.error(`[public.api] ${scope}`, error);
  throw error;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("projects_count, chapters_count, members_count, contact_email, contact_facebook, contact_mobile")
    .eq("id", true)
    .single();

  if (error) logAndThrow("getSiteSettings", error);
  return data as SiteSettings;
}

export async function listPrograms(limit?: number): Promise<Program[]> {
  let q = supabase
    .from("programs")
    .select("id, title, description, image_url, created_at")
    .order("created_at", { ascending: false });

  if (limit) q = q.limit(limit);

  const { data, error } = await q;
  if (error) logAndThrow("listPrograms", error);
  return (data ?? []) as Program[];
}

export async function getProgramById(id: string): Promise<Program | null> {
  const { data, error } = await supabase
    .from("programs")
    .select("id, title, description, image_url, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) logAndThrow("getProgramById", error);
  return (data ?? null) as Program | null;
}

export async function listChapters(limit?: number): Promise<Chapter[]> {
  let q = supabase
    .from("chapters")
    .select("id, name, description, location, contact_name, contact_email, contact_phone, created_at")
    .order("created_at", { ascending: false });

  if (limit) q = q.limit(limit);

  const { data, error } = await q;
  if (error) logAndThrow("listChapters", error);
  return (data ?? []) as Chapter[];
}

export async function listVolunteerOpportunities(limit?: number): Promise<VolunteerOpportunity[]> {
  let q = supabase
    .from("volunteer_opportunities")
    .select("id, event_name, event_date, sdgs, contact_details, created_at, chapter:chapters(id, name)")
    .order("event_date", { ascending: true });

  if (limit) q = q.limit(limit);

  const { data, error } = await q;
  if (error) logAndThrow("listVolunteerOpportunities", error);
  return (data ?? []) as unknown as VolunteerOpportunity[];
}

export async function getMyPublicUser(): Promise<PublicUser | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) logAndThrow("getMyPublicUser.user", userError);
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, phone, created_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) logAndThrow("getMyPublicUser", error);
  return (data ?? null) as PublicUser | null;
}

export async function updateMyPublicUser(input: {
  full_name: string;
  email: string;
  phone: string;
}): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) logAndThrow("updateMyPublicUser.user", userError);
  if (!userData.user) throw new Error("Not authenticated.");

  const { error } = await supabase
    .from("users")
    .update({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
    })
    .eq("id", userData.user.id);

  if (error) logAndThrow("updateMyPublicUser", error);
}

export type VolunteerSignupInput = {
  opportunity_id: string;
  full_name: string;
  email: string;
  phone: string;
  message?: string;
};

export type VolunteerSignup = {
  id: string;
  opportunity_id: string;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  created_at: string;
  opportunity: {
    event_name: string;
    event_date: string;
    chapter: { name: string } | null;
  } | null;
};

export async function signUpForOpportunity(input: VolunteerSignupInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const { error } = await supabase.from("volunteer_signups").insert({
    opportunity_id: input.opportunity_id,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    message: input.message || null,
    user_id: userId,
  });

  if (error) logAndThrow("signUpForOpportunity", error);
}

export async function listMyVolunteerSignups(): Promise<VolunteerSignup[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) logAndThrow("listMyVolunteerSignups.user", userError);
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("volunteer_signups")
    .select(
      "id, opportunity_id, full_name, email, phone, message, created_at, opportunity:volunteer_opportunities(event_name, event_date, chapter:chapters(name))"
    )
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) logAndThrow("listMyVolunteerSignups", error);
  return (data ?? []) as unknown as VolunteerSignup[];
}
