import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { supabase } from "../lib/supabase";
import { fetchMyProfile } from "../lib/profile.service";
import { useToast } from "../components/ui/useToast";

const GENERIC_SIGNIN_ERROR = "Sign-in failed. Please check your credentials or contact support.";

async function loadProfileWithRetry(userId: string, retries = 1) {
  try {
    return await fetchMyProfile(userId);
  } catch (error) {
    if (retries <= 0) throw error;
    return loadProfileWithRetry(userId, retries - 1);
  }
}

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { addToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const userId = data.user?.id;
      if (!userId) throw new Error("Missing authenticated user.");

      const profile = await loadProfileWithRetry(userId);

      if (!profile) {
        await supabase.auth.signOut();
        if (import.meta.env.DEV) {
          console.warn("[SignIn] blocked sign-in: missing profile row for authenticated user.");
        }
        addToast({ type: "error", message: GENERIC_SIGNIN_ERROR });
        return;
      }

      if (profile.role !== "admin" && profile.role !== "chapter_head") {
        await supabase.auth.signOut();
        if (import.meta.env.DEV) {
          console.warn("[SignIn] blocked sign-in: unsupported role.", { actualRole: profile.role });
        }
        addToast({ type: "error", message: GENERIC_SIGNIN_ERROR });
        return;
      }

      const redirectTo = profile.role === "admin" ? "/admin" : "/chapter-head";
      const separator = redirectTo.includes("?") ? "&" : "?";
      navigate(`${redirectTo}${separator}signed_in=1`, { replace: true });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[SignIn] sign-in failed.", err);
      }
      addToast({ type: "error", message: GENERIC_SIGNIN_ERROR });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-40 h-[300px] w-[400px] rotate-[-12deg] border border-[rgba(0,0,0,0.08)] rounded-lg" />
        <div className="absolute -bottom-40 -right-36 h-[320px] w-[420px] rotate-[15deg] border border-[rgba(0,0,0,0.08)] rounded-lg" />
        <div className="absolute -top-20 -right-20 h-[160px] w-[160px] rotate-[25deg] border border-[rgba(255,119,31,0.15)] rounded-md" />
        <div className="absolute -bottom-24 -left-16 h-[140px] w-[140px] rotate-[-20deg] border border-[rgba(0,0,0,0.1)] rounded-md" />
        <div className="absolute top-1/3 left-1/4 h-16 w-24 rotate-12 border border-[rgba(255,119,31,0.2)] rounded-sm" />
      </div>

      <Container>
        <div className="mx-auto max-w-xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            Staff sign in
          </div>

          <h1 className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl">
            Access your <span className="text-[rgb(var(--accent))]">dashboard</span>.
          </h1>

          <p className="mt-5 text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8">
            Staff sign-in for admins and chapter heads.
          </p>

          <Card className="mt-8 border-black/10 bg-white p-6 sm:p-8">
            <form onSubmit={onSubmit} className="grid gap-4">
              <div>
                <label className="text-xs font-medium text-black/70">Email</label>
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
                <label className="text-xs font-medium text-black/70">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                  placeholder="********"
                />
              </div>

              <Button size="lg" className="accent-glow" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </Button>

              <div className="text-xs text-black/55">If you can't sign in, please contact support.</div>
            </form>
          </Card>
        </div>
      </Container>
    </div>
  );
}
