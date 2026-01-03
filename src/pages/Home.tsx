import { useMemo, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";

const HeroBackground = lazy(() => import("../components/three/HeroBackground"));

type Program = { id: string; title: string; description: string; image: string };
type Chapter = { id: string; name: string; location: string };

export default function Home() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const featuredPrograms: Program[] = useMemo(
    () => [
      {
        id: "leadership",
        title: "Youth Leadership & Civic Training",
        description:
          "Premium learning tracks that build confident, service-ready youth leaders.",
        image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=75",
      },
      {
        id: "community",
        title: "Community Service Missions",
        description:
          "High-impact volunteer missions with measurable outcomes across local chapters.",
        image:
          "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1600&q=75",
      },
      {
        id: "sdg",
        title: "SDG Action Projects",
        description:
          "Programs aligned with Sustainable Development Goals—designed for real-world impact.",
        image:
          "https://images.unsplash.com/photo-1520975958225-9c87e8e8a2c5?auto=format&fit=crop&w=1600&q=75",
      },
    ],
    []
  );

  const chapters: Chapter[] = useMemo(
    () => [
      { id: "ncr", name: "NCR Chapter", location: "Metro Manila" },
      { id: "north", name: "North Luzon Chapter", location: "Luzon" },
      { id: "visayas", name: "Visayas Chapter", location: "Visayas" },
      { id: "mindanao", name: "Mindanao Chapter", location: "Mindanao" },
    ],
    []
  );

  // keep your stats source (mock/dynamic) unchanged
  const stats = useMemo(() => ({ projects: 28, chapters: 12, members: 740 }), []);

  return (
    <div ref={scope}>
      {/* HERO */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        {/* Background layers */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[rgb(var(--bg))]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.00),rgba(255,255,255,0.85))]" />

          <Suspense fallback={null}>
            <div className="pointer-events-none absolute inset-0 opacity-[0.36]">
              <HeroBackground />
            </div>
          </Suspense>
        </div>

        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left */}
            <div className="lg:col-span-7">
              <div data-reveal className="flex flex-wrap items-center gap-3">
                <Badge>Nonprofit • Civic-tech • Chapter network</Badge>
                <span className="inline-flex items-center rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/60 backdrop-blur">
                  SDG-aligned impact
                </span>
              </div>

              <h1
                data-reveal
                className="mt-7 max-w-2xl [font-family:var(--font-display)] text-5xl leading-[0.98] tracking-[-0.03em] sm:text-6xl"
              >
                Make youth service feel{" "}
                <span className="text-[rgb(var(--accent))]">inevitable</span>.
              </h1>

              <p
                data-reveal
                className="mt-7 max-w-xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
              >
                Youth Service Philippines connects volunteers, chapters, and programs
                into a modern service portal—so meaningful action is always one click away.
              </p>

              <div data-reveal className="mt-9 flex flex-wrap gap-3">
                <Link to="/volunteer-opportunities">
                  <Button size="lg" className="accent-glow">
                    Browse Opportunities
                  </Button>
                </Link>
                <Link to="/programs">
                  <Button size="lg" variant="secondary">
                    Explore Programs
                  </Button>
                </Link>
                <Link to="/membership-and-chapter">
                  <Button size="lg" variant="ghost">
                    Become a Member →
                  </Button>
                </Link>
              </div>

              {/* Stats strip */}
              <div
                data-reveal
                className="mt-10 grid gap-3 rounded-3xl border border-black/10 bg-white/60 p-4 backdrop-blur sm:grid-cols-3 sm:p-5"
              >
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45">
                    Projects
                  </div>
                  <div className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.03em]">
                    {stats.projects}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45">
                    Chapters
                  </div>
                  <div className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.03em]">
                    {stats.chapters}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45">
                    Members
                  </div>
                  <div className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.03em]">
                    {stats.members}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: editorial feature stack */}
            <div className="lg:col-span-5">
              <div data-reveal className="space-y-4">
                <Card className="group overflow-hidden border-black/10 bg-white/65 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-2)]">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-70 transition-opacity duration-300 group-hover:opacity-85" />
                    <img
                      src="https://images.unsplash.com/photo-1529397938791-2aba4681454c?auto=format&fit=crop&w=1600&q=70"
                      alt="Chapters coordinating volunteers"
                      className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">Chapter-led coordination</div>
                      <span className="rounded-full bg-[rgba(255,119,31,0.10)] px-3 py-1 text-xs text-[rgb(var(--accent))]">
                        Local
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-black/65">
                      Opportunities are created close to communities—built by leaders who know what matters.
                    </p>
                  </div>
                </Card>

                <Card className="border-black/10 bg-[rgb(var(--card))] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">Designed for clarity</div>
                      <p className="mt-3 text-sm leading-6 text-black/65">
                        Programs, chapters, and SDGs—structured so volunteers can decide fast and act confidently.
                      </p>
                    </div>
                    <div className="grid size-11 place-items-center rounded-2xl bg-white shadow-sm">
                      <span className="text-[rgb(var(--accent))]">✦</span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="text-xs font-semibold text-black/70">Volunteer-ready</div>
                      <p className="mt-2 text-xs leading-5 text-black/60">
                        Clear events, dates, chapters, SDGs, and sign-up contacts.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="text-xs font-semibold text-black/70">Chapter-friendly</div>
                      <p className="mt-2 text-xs leading-5 text-black/60">
                        Built for scale across regions, without losing local identity.
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="flex flex-wrap gap-3">
                  <Link to="/membership-and-chapter" className="w-full sm:w-auto">
                    <Button size="lg" variant="secondary" className="w-full">
                      Membership & Chapters
                    </Button>
                  </Link>
                  <Link to="/contact" className="w-full sm:w-auto">
                    <Button size="lg" variant="ghost" className="w-full">
                      Contact →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured Programs (premium editorial cards) */}
      <Section
        eyebrow="Programs"
        title="Programs built for real, measurable impact"
        description="Curated initiatives designed for clarity and momentum—each one built to scale across chapters."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {featuredPrograms.map((p) => (
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

      {/* Chapters (calm + consistent grid rhythm) */}
      <Section
        eyebrow="Chapters"
        title="A chapter network across the Philippines"
        description="Discover where youth leaders are organizing service—and join the chapter nearest you."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {chapters.map((c) => (
            <Card
              key={c.id}
              data-reveal
              className="group border-black/10 bg-white/75 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="mt-1 text-sm text-black/60">{c.location}</div>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-[rgba(255,119,31,0.10)] text-[rgb(var(--accent))] transition-transform duration-300 group-hover:scale-[1.06]">
                  ✦
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-black/65">
                Volunteer locally and collaborate with nearby communities through YSP programs.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-black/60">
                <span className="size-1.5 rounded-full bg-black/20" />
                View chapter opportunities
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Soft closing CTA */}
      <section className="py-14 sm:py-18">
        <Container>
          <div
            data-reveal
            className="relative overflow-hidden rounded-3xl border border-black/10 bg-[rgb(var(--card))] p-8 sm:p-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_0%,rgba(255,119,31,0.14),transparent_60%)]" />
            <div className="relative grid gap-6 md:grid-cols-12 md:items-center">
              <div className="md:col-span-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  Ready to serve
                </div>
                <div className="mt-3 [font-family:var(--font-display)] text-3xl leading-[1.05] tracking-[-0.02em] sm:text-4xl">
                  Start with one opportunity. Let it compound.
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-black/65">
                  Browse volunteer opportunities by chapter, see SDGs impacted, and contact chapter heads to join.
                </p>
              </div>
              <div className="md:col-span-4 md:flex md:justify-end">
                <Link to="/volunteer-opportunities">
                  <Button size="lg" className="accent-glow">
                    Browse Opportunities
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
