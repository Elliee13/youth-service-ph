import { useRef } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";

const opportunities = [
  {
    event_name: "Community Clean-up Drive",
    event_date: "2026-01-18",
    chapter: "NCR Chapter",
    sdgs: ["SDG 11", "SDG 13"],
    contact_details: "Message the chapter head: +63 917 000 0000",
  },
  {
    event_name: "Youth Reading Program",
    event_date: "2026-02-02",
    chapter: "Visayas Chapter",
    sdgs: ["SDG 4", "SDG 10"],
    contact_details: "Email: visayas.chapter@ysp.ph",
  },
];

export default function VolunteerOpportunities() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  return (
    <div ref={scope}>
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_85%_0%,rgba(2,6,23,0.07),transparent_55%)]" />
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
          </div>
        </Container>
      </section>

      <Section
        eyebrow="Upcoming"
        title="Volunteer opportunities"
        description="Card-based layout with clear metadata hierarchy for effortless scanning."
      >
        <div className="grid gap-5">
          {opportunities.map((o) => (
            <Card
              key={`${o.event_name}-${o.event_date}`}
              data-reveal
              className="border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{o.event_name}</div>
                  <div className="mt-2 text-sm text-black/60">
                    <span className="font-medium text-black/70">{o.chapter}</span>{" "}
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
                <div className="mt-2 text-sm leading-6 text-black/65">
                  {o.contact_details}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
