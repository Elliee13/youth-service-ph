import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { listVolunteerOpportunities, type VolunteerOpportunity } from "../lib/public.api";
import { SignUpModal } from "../components/volunteer/SignUpModal";

export default function VolunteerOpportunities() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [signUpModal, setSignUpModal] = useState<{
    opportunity: VolunteerOpportunity;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listVolunteerOpportunities();
        if (!alive) return;
        setItems(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load opportunities.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700">
                {error}
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

      {/* Sign Up Modal */}
      {signUpModal ? (
        <SignUpModal
          opportunityId={signUpModal.opportunity.id}
          opportunityName={signUpModal.opportunity.event_name}
          opportunityDate={signUpModal.opportunity.event_date}
          chapterName={signUpModal.opportunity.chapter?.name ?? null}
          onClose={() => {
            setSignUpModal(null);
            setSuccessMessage(null);
          }}
          onSuccess={() => {
            setSuccessMessage(
              `Successfully signed up for ${signUpModal.opportunity.event_name}! The chapter head will contact you soon.`
            );
          }}
        />
      ) : null}

      {/* Success Message Toast */}
      {successMessage ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-md rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 shadow-lg">
          <div className="font-semibold">Success!</div>
          <div className="mt-1">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="mt-2 text-xs text-green-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
