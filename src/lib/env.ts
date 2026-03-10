export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  appBuildId:
    (import.meta.env.VITE_APP_BUILD_ID as string | undefined) ??
    __APP_BUILD_ID__ ??
    __APP_VERSION__,
};

if (!env.supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL in .env.local");
if (!env.supabaseAnonKey) throw new Error("Missing VITE_SUPABASE_ANON_KEY in .env.local");
