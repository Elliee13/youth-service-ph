import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { useGsapReveal } from "../hooks/useGsapReveal";
import {
  listMyVolunteerSignups,
  listVolunteerOpportunities,
  type VolunteerOpportunity,
  type VolunteerSignup,
} from "../lib/public.api";
import { SignUpModal } from "../components/volunteer/SignUpModal";
import { useAuth } from "../auth/AuthProvider";
import { Link } from "react-router-dom";
import { useToast } from "../components/ui/ToastProvider";

export default function VolunteerOpportunities() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [mySignups, setMySignups] = useState<VolunteerSignup[]>([]);
  const [signUpModal, setSignUpModal] = useState<{
    opportunity: VolunteerOpportunity;
  } | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listVolunteerOpportunities();
        if (!alive) return;
        setItems(data);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message ?? "Failed to load opportunities.";
        addToast({ type: "error", message: msg });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!user) {
      setMySignups([]);
      return;
    }

    (async () => {
      try {
        const data = await listMyVolunteerSignups();
        if (!alive) return;
        setMySignups(data);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message ?? "Failed to load your signups.";
        addToast({ type: "error", message: msg });
      }
    })();

    return () => {
      alive = false;
    };
  }, [user]);

  return (
    <div ref={scope}>
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.00),rgba(255,255,255,0.92))]" />
        </div>

        <Container>
          <div className="max-w-3xl">
            <div data-reveal className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Volunteer
            </div>
            <h1
              data-reveal
              className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl"
            >
              Opportunities by chapter—designed for fast{" "}
              <span className="text-[rgb(var(--accent))]">action</span>.
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-2xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
            >
              Scan event details, SDGs impacted, and contact information to sign up directly.
            </p>

            {!user ? (
              <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 px-4 py-4 text-sm text-black/70 shadow-sm">
                Create a volunteer account to auto-fill signup details and track your history.{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[rgb(var(--accent))] hover:underline"
                >
                  Register now
                </Link>
                .
              </div>
            ) : null}

          </div>
        </Container>
      </section>

      <Section
        eyebrow="Upcoming"
        title="Volunteer opportunities"
        description="Card-based layout with clear metadata hierarchy for effortless scanning."
      >
        <div className="grid gap-5">
          {items.map((o) => (
            <Card
              key={o.id}
              data-reveal
              className="border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{o.event_name}</div>
                  <div className="mt-2 text-sm text-black/60">
                    <span className="font-medium text-black/70">
                      {o.chapter?.name ?? "Unknown chapter"}
                    </span>{" "}
                    <span className="mx-2 text-black/25">•</span>
                    <span className="tabular-nums text-black/70">{o.event_date}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {o.sdgs.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-black/10 bg-[rgba(255,119,31,0.10)] px-3 py-1 text-xs font-medium text-[rgb(var(--accent))]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  Sign up
                </div>
                <div className="mt-2 text-sm leading-6 text-black/65">{o.contact_details}</div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    className="accent-glow"
                    onClick={() => setSignUpModal({ opportunity: o })}
                  >
                    Sign Up Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {user ? (
        <Section
          eyebrow="My activity"
          title="Your signups"
          description="A quick log of the opportunities you’ve registered for."
        >

          {mySignups.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/60">
              You haven’t signed up yet. Pick an opportunity above to get started.
            </div>
          ) : null}

          <div className="grid gap-4">
            {mySignups.map((signup) => (
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
        </Section>
      ) : null}

      {/* Sign Up Modal */}
      {signUpModal ? (
        <SignUpModal
          opportunityId={signUpModal.opportunity.id}
          opportunityName={signUpModal.opportunity.event_name}
          opportunityDate={signUpModal.opportunity.event_date}
          chapterName={signUpModal.opportunity.chapter?.name ?? null}
          onClose={() => {
            setSignUpModal(null);
          }}
          onSuccess={() => {
            addToast({
              type: "success",
              message: `Successfully signed up for ${signUpModal.opportunity.event_name}! The chapter head will contact you soon.`,
            });
          }}
        />
      ) : null}
    </div>
  );
}
