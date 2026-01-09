import type { Role } from "./auth.types";

export function normalizeRole(input: string | null | undefined): Role | null {
  if (!input) return null;
  if (input === "admin") return "admin";
  if (input === "chapter_head") return "chapter_head";
  return null;
}
