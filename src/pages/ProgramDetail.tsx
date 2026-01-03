import { useParams, Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";

const programById: Record<
  string,
  { title: string; description: string; image: string; body: string }
> = {
  leadership: {
    title: "Youth Leadership & Civic Training",
    description: "Leadership tracks designed for service-ready youth leaders.",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=75",
    body:
      "This program equips members with civic competence, leadership discipline, and community facilitation skills. Chapters can adopt modules and run cohorts locally.",
  },
  community: {
    title: "Community Service Missions",
    description: "Volunteer missions with measurable outcomes led by chapters.",
    image:
      "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=2000&q=75",
    body:
      "Chapters coordinate service missions with clear goals, roles, and reporting. Designed for repeatable impact and sustained community relationships.",
  },
  sdg: {
    title: "SDG Action Projects",
    description: "Programs aligned with SDGs for meaningful, trackable impact.",
    image:
      "https://images.unsplash.com/photo-1520975958225-9c87e8e8a2c5?auto=format&fit=crop&w=2000&q=75",
    body:
      "A structured approach to identify SDGs impacted, plan initiatives, and measure outcomes over time—ideal for chapter portfolios and partnerships.",
  },
};

export default function ProgramDetail() {
  const { id } = useParams();
  const program = (id && programById[id]) || null;

  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  if (!program) {
    return (
      <Container>
        <div className="py-16">
          <div className="[font-family:var(--font-display)] text-3xl tracking-[-0.02em]">
            Program not found
          </div>
          <p className="mt-3 text-sm text-black/65">
            The program you’re looking for may not exist.
          </p>
          <div className="mt-6">
            <Link to="/programs">
              <Button variant="secondary">Back to Programs</Button>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div ref={scope} className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl">
          <div data-reveal className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            Program
          </div>
          <h1
            data-reveal
            className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.04] tracking-[-0.03em] sm:text-5xl"
          >
            {program.title}
          </h1>
          <p
            data-reveal
            className="mt-5 text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
          >
            {program.description}
          </p>

          <div data-reveal className="mt-7 flex flex-wrap gap-3">
            <Link to="/volunteer-opportunities">
              <Button className="accent-glow">View Opportunities</Button>
            </Link>
            <Link to="/programs">
              <Button variant="secondary">Back to Programs</Button>
            </Link>
          </div>
        </div>

        <Card data-reveal className="mt-10 overflow-hidden border-black/10 bg-white">
          <div className="relative aspect-[16/7] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-70" />
            <img
              src={program.image}
              alt={program.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="p-7 sm:p-10">
            <div data-reveal className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Overview
            </div>
            <p
              data-reveal
              className="mt-4 max-w-3xl text-[15px] leading-7 text-black/65 sm:text-base sm:leading-8"
            >
              {program.body}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div data-reveal className="rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-5">
                <div className="text-xs font-semibold text-black/70">
                  Designed for chapter delivery
                </div>
                <p className="mt-2 text-xs leading-5 text-black/60">
                  Structured so chapters can repeat the program locally while keeping quality consistent.
                </p>
              </div>
              <div data-reveal className="rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-5">
                <div className="text-xs font-semibold text-black/70">
                  SDG-aligned outcomes
                </div>
                <p className="mt-2 text-xs leading-5 text-black/60">
                  Clear goals and reporting help volunteers understand impact and stay engaged.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div data-reveal className="mt-10 rounded-3xl border border-black/10 bg-[rgb(var(--card))] p-8 sm:p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            Next step
          </div>
          <div className="mt-3 [font-family:var(--font-display)] text-3xl tracking-[-0.02em] sm:text-4xl">
            Start with one opportunity.
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-black/65">
            Browse opportunities by chapter and connect directly with chapter heads to join.
          </p>
          <div className="mt-6">
            <Link to="/volunteer-opportunities">
              <Button size="lg" className="accent-glow">
                Browse Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
