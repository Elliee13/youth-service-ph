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
  sdgs: string[];
  contact_details: string;
  created_at: string;
};

export type SiteSettingsRow = {
  id: boolean;
  projects_count: number;
  chapters_count: number;
  members_count: number;
  contact_email: string;
  contact_facebook: string;
  contact_mobile: string;
  updated_at: string;
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
export async function listOpportunities(): Promise<OpportunityRow[]> {
  const { data, error } = await supabase
    .from("volunteer_opportunities")
    .select("id, event_name, event_date, chapter_id, sdgs, contact_details, created_at")
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OpportunityRow[];
}

export async function createOpportunity(input: Omit<OpportunityRow, "id" | "created_at">) {
  const { error } = await supabase.from("volunteer_opportunities").insert(input);
  if (error) throw error;
}

export async function updateOpportunity(id: string, input: Partial<Omit<OpportunityRow, "id" | "created_at">>) {
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
    .select("id, projects_count, chapters_count, members_count, contact_email, contact_facebook, contact_mobile, updated_at")
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
