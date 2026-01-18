import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { listPrograms, type Program } from "../lib/public.api";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/ToastProvider";

const FALLBACK_PROGRAM_IMAGE =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=75";

export default function Programs() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await listPrograms();
        if (!alive) return;
        setPrograms(p);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message ?? "Failed to load programs.";
        setError(msg);
        addToast({ type: "error", message: msg });
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
                    src={p.image_url ?? FALLBACK_PROGRAM_IMAGE}
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

     {/* ================= NEXT STEP ================= */}
      <Section
        eyebrow="Get involved"
        title="Turn intent into action"
        description="Discover volunteer opportunities led by local chapters and take part in work that creates real impact."
      >
        <div
          data-reveal
          className="mt-10 rounded-3xl border border-black/10 bg-[rgb(var(--card))] p-8 sm:p-10"
        >
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
      </Section>
    </div>
  );
}
