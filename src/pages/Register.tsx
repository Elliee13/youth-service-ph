import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/ToastProvider";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { addToast } = useToast();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        localStorage.setItem("ysp_auth_notice", "welcome");
        navigate("/my-account?welcome=1", { replace: true });
        return;
      }

      const info = "Check your email to confirm your account before signing in.";
      addToast({ type: "success", message: info });
    } catch (err: any) {
      const msg = err?.message ?? "Registration failed.";
      addToast({ type: "error", message: msg });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      if (signInError) throw signInError;
      localStorage.setItem("ysp_auth_notice", "signed_in");
      navigate("/my-account?signed_in=1", { replace: true });
    } catch (err: any) {
      const msg = err?.message ?? "Sign-in failed.";
      addToast({ type: "error", message: msg });
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleAuth() {
    setBusy(true);
    try {
      localStorage.setItem("ysp_auth_notice", "signed_in");
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/my-account?signed_in=1`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      const msg = err?.message ?? "Google sign-in failed.";
      addToast({ type: "error", message: msg });
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 -left-36 h-[280px] w-[380px] rotate-[-12deg] border border-[rgba(0,0,0,0.08)] rounded-lg" />
        <div className="absolute -bottom-36 -right-36 h-[300px] w-[420px] rotate-[12deg] border border-[rgba(0,0,0,0.08)] rounded-lg" />
        <div className="absolute -top-16 -right-12 h-[140px] w-[140px] rotate-[25deg] border border-[rgba(255,119,31,0.18)] rounded-md" />
        <div className="absolute -bottom-20 -left-12 h-[120px] w-[120px] rotate-[-18deg] border border-[rgba(0,0,0,0.1)] rounded-md" />
      </div>

      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            Volunteer account
          </div>
          <h1 className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl">
            Join the movement and{" "}
            <span className="text-[rgb(var(--accent))]">track</span> your impact.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8">
            Create a public volunteer account to save your details, sign up faster, and view your
            signup history.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="border-black/10 bg-white p-6 sm:p-8">
              <div className="text-sm font-semibold">Create account</div>
              <p className="mt-2 text-xs text-black/60">
                Use your email/password or sign up with Google.
              </p>

              <form onSubmit={handleSignUp} className="mt-5 grid gap-4">
                <div>
                  <label className="text-xs font-medium text-black/70">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    required
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                    placeholder="Juan dela Cruz"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black/70">Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                    placeholder="09123456789"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black/70">Email</label>
                  <input
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    type="email"
                    required
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black/70">Password</label>
                  <input
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    type="password"
                    required
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                    placeholder="Create a strong password"
                  />
                </div>

                <Button size="lg" className="accent-glow" disabled={busy}>
                  {busy ? "Creating account..." : "Create account"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGoogleAuth}
                  disabled={busy}
                >
                  Continue with Google
                </Button>
              </form>
            </Card>

            <Card className="border-black/10 bg-white p-6 sm:p-8">
              <div className="text-sm font-semibold">Sign in</div>
              <p className="mt-2 text-xs text-black/60">
                Already registered? Sign in to access your saved details.
              </p>

              <form onSubmit={handleSignIn} className="mt-5 grid gap-4">
                <div>
                  <label className="text-xs font-medium text-black/70">Email</label>
                  <input
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    type="email"
                    required
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black/70">Password</label>
                  <input
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    type="password"
                    required
                    className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                    placeholder="Your password"
                  />
                </div>

                <Button size="lg" className="accent-glow" disabled={busy}>
                  {busy ? "Signing in..." : "Sign in"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGoogleAuth}
                  disabled={busy}
                >
                  Sign in with Google
                </Button>
              </form>

              <div className="mt-6 text-xs text-black/55">
                Admin or chapter head?{" "}
                <Link
                  to="/sign-in?role=admin"
                  className="font-semibold text-[rgb(var(--accent))] hover:underline"
                >
                  Use the admin sign-in
                </Link>
                .
              </div>
            </Card>
          </div>

        </div>
      </Container>
    </div>
  );
}
