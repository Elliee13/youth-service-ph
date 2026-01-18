import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";
import { Button } from "../components/ui/Button";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { useAuth } from "../auth/AuthProvider";
import {
  getMyPublicUser,
  listMyVolunteerSignups,
  updateMyPublicUser,
  type PublicUser,
  type VolunteerSignup,
} from "../lib/public.api";

export default function MyAccount() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();

  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [signups, setSignups] = useState<VolunteerSignup[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    if (profile?.role) return;

    let alive = true;
    (async () => {
      try {
        const data = await getMyPublicUser();
        const history = await listMyVolunteerSignups();
        if (!alive) return;

        setPublicUser(data);
        setSignups(history);
        setFullName(data?.full_name ?? "");
        setEmail(data?.email ?? user.email ?? "");
        setPhone(data?.phone ?? "");
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load profile.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, profile?.role]);

  useEffect(() => {
    if (!user) {
      navigate("/register", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (params.get("welcome") === "1") {
      setSuccess("Welcome! Your volunteer account is ready.");
      params.delete("welcome");
      setParams(params, { replace: true });
    }
    if (params.get("signed_in") === "1") {
      setSuccess("Signed in successfully.");
      params.delete("signed_in");
      setParams(params, { replace: true });
    }
    if (params.get("error") || params.get("error_description")) {
      const description = params.get("error_description") || params.get("error");
      setError(description ? decodeURIComponent(description) : "Sign-in failed.");
      params.delete("error");
      params.delete("error_description");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    if (!user) return;
    const notice = localStorage.getItem("ysp_auth_notice");
    if (!notice) return;
    if (notice === "welcome") {
      setSuccess("Welcome! Your volunteer account is ready.");
    } else if (notice === "signed_in") {
      setSuccess("Signed in successfully.");
    }
    localStorage.removeItem("ysp_auth_notice");
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      await updateMyPublicUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setSuccess("Profile updated.");
    } catch (e: any) {
      setError(e?.message ?? "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/?signed_out=1", { replace: true });
  }

  if (profile?.role) {
    return (
      <Container>
        <div className="py-12 sm:py-16">
          <Card className="border-black/10 bg-white p-6 text-sm text-black/70">
            This page is for public volunteer accounts. Use your dashboard sign-in.
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <div ref={scope}>
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.00),rgba(255,255,255,0.92))]" />
        </div>

        <Container>
          <div className="max-w-3xl">
            <div data-reveal className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              My account
            </div>
            <h1
              data-reveal
              className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl"
            >
              Your volunteer profile,{" "}
              <span className="text-[rgb(var(--accent))]">organized</span>.
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-2xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
            >
              Update your saved details and keep track of every opportunity you’ve joined.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="Profile"
        title="Your details"
        description="These fields auto-fill your volunteer signups."
      >
        <Card className="border-black/10 bg-white p-6 sm:p-8">
          <form onSubmit={handleSave} className="grid gap-4 sm:max-w-xl">
            <div>
              <label className="text-xs font-medium text-black/70">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-black/70">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-black/70">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                placeholder="09123456789"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="accent-glow" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="secondary" onClick={handleSignOut}>
                Log out
              </Button>
            </div>
          </form>

          {success ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {publicUser ? null : (
            <div className="mt-3 text-xs text-black/55">
              You may need to refresh after confirming your email.
            </div>
          )}
        </Card>
      </Section>

      <Section
        eyebrow="History"
        title="Volunteer signups"
        description="A timeline of your volunteer opportunities."
      >
        {signups.length === 0 ? (
          <Card className="border-black/10 bg-white p-5 text-sm text-black/60">
            No signups yet. Visit the volunteer opportunities page to get started.
          </Card>
        ) : (
          <div className="grid gap-4">
            {signups.map((signup) => (
              <Card key={signup.id} className="border-black/10 bg-white p-5">
                <div className="text-sm font-semibold">
                  {signup.opportunity?.event_name ?? "Opportunity"}
                </div>
                <div className="mt-2 text-xs text-black/60">
                  <span className="font-medium text-black/70">
                    {signup.opportunity?.chapter?.name ?? "Unknown chapter"}
                  </span>
                  <span className="mx-2 text-black/25">•</span>
                  <span className="tabular-nums">
                    {signup.opportunity?.event_date ?? "Date pending"}
                  </span>
                </div>
                <div className="mt-3 text-xs text-black/55">
                  Signed up on{" "}
                  <span className="tabular-nums">
                    {new Date(signup.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
