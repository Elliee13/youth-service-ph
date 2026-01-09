import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Status = {
  projectUrl: string;
  anonKeyPrefix: string;
  session: "present" | "none" | "error";

  programsLen: number | "error";
  chaptersLen: number | "error";
  siteSettings: "ok" | "missing" | "error";

  programsFirstId?: string;
  chaptersFirstId?: string;

  lastError?: string;
};

export default function SupabaseStatus() {
  const [status, setStatus] = useState<Status>(() => ({
    projectUrl: (import.meta as any).env?.VITE_SUPABASE_URL ?? "(missing)",
    anonKeyPrefix:
      ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? "").slice(0, 12) || "(missing)",
    session: "none",
    programsLen: 0,
    chaptersLen: 0,
    siteSettings: "missing",
  }));

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Session check
        const sessionRes = await supabase.auth.getSession();
        const hasSession = !!sessionRes.data.session;

        // Fetch actual rows (not HEAD count)
        const programsRes = await supabase
          .from("programs")
          .select("id")
          .limit(3);

        const chaptersRes = await supabase
          .from("chapters")
          .select("id")
          .limit(3);

        const settingsRes = await supabase
          .from("site_settings")
          .select("id")
          .eq("id", true)
          .maybeSingle();

        const err =
          programsRes.error?.message ||
          chaptersRes.error?.message ||
          settingsRes.error?.message ||
          undefined;

        if (!alive) return;

        setStatus((s) => ({
          ...s,
          session: hasSession ? "present" : "none",

          programsLen: programsRes.error ? "error" : (programsRes.data?.length ?? 0),
          chaptersLen: chaptersRes.error ? "error" : (chaptersRes.data?.length ?? 0),

          programsFirstId: programsRes.data?.[0]?.id,
          chaptersFirstId: chaptersRes.data?.[0]?.id,

          siteSettings: settingsRes.error ? "error" : settingsRes.data ? "ok" : "missing",
          lastError: err,
        }));
      } catch (e: any) {
        if (!alive) return;
        setStatus((s) => ({
          ...s,
          session: "error",
          programsLen: "error",
          chaptersLen: "error",
          siteSettings: "error",
          lastError: e?.message ?? String(e),
        }));
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/70 backdrop-blur">
      <div className="font-semibold">Supabase Status</div>

      <div className="mt-2 grid gap-1">
        <div>
          <span className="text-black/50">URL:</span> {status.projectUrl}
        </div>
        <div>
          <span className="text-black/50">Anon key:</span> {status.anonKeyPrefix}…
        </div>
        <div>
          <span className="text-black/50">Session:</span> {status.session}
        </div>

        <div className="mt-2 font-semibold text-black/60">Table reads (LIMIT 3)</div>

        <div>
          <span className="text-black/50">Programs rows fetched:</span>{" "}
          {String(status.programsLen)}
          {status.programsFirstId ? (
            <span className="text-black/40"> • first: {status.programsFirstId}</span>
          ) : null}
        </div>

        <div>
          <span className="text-black/50">Chapters rows fetched:</span>{" "}
          {String(status.chaptersLen)}
          {status.chaptersFirstId ? (
            <span className="text-black/40"> • first: {status.chaptersFirstId}</span>
          ) : null}
        </div>

        <div>
          <span className="text-black/50">Site settings:</span> {status.siteSettings}
        </div>

        {status.lastError ? (
          <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/5 p-2 text-red-700">
            {status.lastError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
