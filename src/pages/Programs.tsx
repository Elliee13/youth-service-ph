import { Link } from "react-router-dom";
import { useRef } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";

const programs = [
  {
    id: "leadership",
    title: "Youth Leadership & Civic Training",
    description: "Leadership tracks designed for service-ready youth leaders.",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=75",
  },
  {
    id: "community",
    title: "Community Service Missions",
    description: "Volunteer missions with measurable outcomes led by chapters.",
    image:
      "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1600&q=75",
  },
  {
    id: "sdg",
    title: "SDG Action Projects",
    description: "Programs aligned with SDGs for meaningful, trackable impact.",
    image:
      "https://images.unsplash.com/photo-1520975958225-9c87e8e8a2c5?auto=format&fit=crop&w=1600&q=75",
  },
];

export default function Programs() {
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
              Programs
            </div>
            <h1
              data-reveal
              className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl"
            >
              Explore programs built for{" "}
              <span className="text-[rgb(var(--accent))]">measurable</span> impact.
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-2xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
            >
              A curated set of initiatives designed for clarity, momentum, and scale across chapters.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="Browse"
        title="Find the program that fits your community"
        description="Clean grid density, consistent image treatment, and premium hover interactions."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <Link key={p.id} to={`/programs/${p.id}`} data-reveal>
              <Card className="group overflow-hidden border-black/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-2)]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0 opacity-70 transition-opacity duration-300 group-hover:opacity-85" />
                  <img
                    src={p.image}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-base font-semibold leading-6">{p.title}</div>
                    <span className="mt-0.5 rounded-full bg-[rgba(255,119,31,0.10)] px-3 py-1 text-xs text-[rgb(var(--accent))]">
                      View
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-black/65">{p.description}</p>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm text-black/70">
                    <span className="size-1.5 rounded-full bg-[rgb(var(--accent))]" />
                    Learn more
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
