export type Role = "admin" | "chapter_head";

export type Profile = {
  id: string;
  role: Role;
  chapter_id: string | null;
  created_at?: string;
};
