// Placeholder until generated Supabase types are added.
// Keep this permissive for now to avoid blocking CI builds.
type TableLike = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: Array<{
    foreignKeyName: string;
    columns: string[];
    referencedRelation: string;
    referencedColumns: string[];
    isOneToOne?: boolean;
  }>;
};

type ViewLike = {
  Row: Record<string, unknown>;
  Insert?: Record<string, unknown>;
  Update?: Record<string, unknown>;
  Relationships: TableLike["Relationships"];
};

type FunctionLike = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: Record<string, TableLike>;
    Views: Record<string, ViewLike>;
    Functions: Record<string, FunctionLike>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
};
