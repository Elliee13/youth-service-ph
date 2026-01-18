import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { supabase } from "../lib/supabase";
import { fetchMyProfile } from "../lib/profile.service";
import { normalizeRole } from "../auth/auth.utils";
import type { Role } from "../auth/auth.types";
import { useToast } from "../components/ui/ToastProvider";

export default function SignIn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialRole = normalizeRole(params.get("role")) ?? "chapter_head";
  const [role, setRole] = useState<Role>(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? (role === "admin" ? "/admin" : "/chapter-head");
  }, [location.state, role]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const profile = await fetchMyProfile();

      if (!profile) {
        await supabase.auth.signOut();
        const message =
          "Your account is not provisioned yet (no profile role assigned). Ask the admin to create your profile in the database.";
        setError(message);
        addToast({ type: "error", message });
        return;
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();
        const message = `Role mismatch. Your account is '${profile.role}', but you tried to sign in as '${role}'.`;
        setError(message);
        addToast({ type: "error", message });
        return;
      }

      const separator = redirectTo.includes("?") ? "&" : "?";
      navigate(`${redirectTo}${separator}signed_in=1`, { replace: true });
    } catch (err: any) {
      const message = err?.message ?? "Sign-in failed.";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden py-12 sm:py-16">

      {/* ================= CUBISM GEOMETRIC BACKGROUND ================= */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Oversized rotated rectangle top-left */}
        <div className="absolute -top-32 -left-40 h-[300px] w-[400px] rotate-[-12deg] border border-[rgba(0,0,0,0.08)] rounded-lg" />

        {/* Large rectangle bottom-right */}
        <div className="absolute -bottom-40 -right-36 h-[320px] w-[420px] rotate-[15deg] border border-[rgba(0,0,0,0.08)] rounded-lg" />

        {/* Medium square top-right */}
        <div className="absolute -top-20 -right-20 h-[160px] w-[160px] rotate-[25deg] border border-[rgba(255,119,31,0.15)] rounded-md" />

        {/* Medium square bottom-left */}
        <div className="absolute -bottom-24 -left-16 h-[140px] w-[140px] rotate-[-20deg] border border-[rgba(0,0,0,0.1)] rounded-md" />

        {/* Accent small rotated rectangle */}
        <div className="absolute top-1/3 left-1/4 h-16 w-24 rotate-12 border border-[rgba(255,119,31,0.2)] rounded-sm" />
      </div>



      <Container>
        <div className="mx-auto max-w-xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            Sign in
          </div>

          <h1 className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl">
            Access your{" "}
            <span className="text-[rgb(var(--accent))]">dashboard</span>.
          </h1>

          <p className="mt-5 text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8">
            Choose your role and sign in securely.
          </p>

          <Card className="mt-8 border-black/10 bg-white p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  role === "admin"
                    ? "border-[rgba(255,119,31,0.35)] bg-[rgba(255,119,31,0.08)]"
                    : "border-black/10 hover:bg-black/5",
                ].join(" ")}
              >
                <div className="text-sm font-semibold">Admin</div>
                <div className="mt-1 text-xs text-black/60">
                  Manage programs, chapters, opportunities, and site settings.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("chapter_head")}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  role === "chapter_head"
                    ? "border-[rgba(255,119,31,0.35)] bg-[rgba(255,119,31,0.08)]"
                    : "border-black/10 hover:bg-black/5",
                ].join(" ")}
              >
                <div className="text-sm font-semibold">Chapter Head</div>
                <div className="mt-1 text-xs text-black/60">
                  Manage opportunities for your own chapter.
                </div>
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="text-xs font-medium text-black/70">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black/70">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button size="lg" className="accent-glow" disabled={busy}>
                {busy
                  ? "Signing in…"
                  : `Sign in as ${
                      role === "admin" ? "Admin" : "Chapter Head"
                    }`}
              </Button>

              <div className="text-xs text-black/55">
                If you can sign in but see “not provisioned,” your profile row
                hasn’t been created yet.
              </div>
            </form>
          </Card>
        </div>
      </Container>
    </div>
  );
}
