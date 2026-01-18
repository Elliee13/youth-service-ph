import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useToast } from "../components/ui/ToastProvider";

import { useGsapReveal } from "../hooks/useGsapReveal";
import {
  getSiteSettings,
  listChapters,
  listPrograms,
  type Chapter,
  type Program,
  type SiteSettings,
} from "../lib/public.api";

import heroRight from "../assets/hero/hero-right.jpg";

const HeroBackground = lazy(() => import("../components/three/HeroBackground"));

const FALLBACK_PROGRAM_IMAGE =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=75";

export default function Home() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const { addToast } = useToast();

  useEffect(() => {
    let alive = true;

    (async () => {
      setError(null);

      const [s, p, c] = await Promise.allSettled([
        getSiteSettings(),
        listPrograms(3),
        listChapters(8),
      ]);

      if (!alive) return;

      if (s.status === "fulfilled") setSettings(s.value);
      else console.warn("[Home] getSiteSettings failed:", s.reason);

      if (p.status === "fulfilled") setPrograms(p.value);
      else {
        console.warn("[Home] listPrograms failed:", p.reason);
        setPrograms([]);
      }

      if (c.status === "fulfilled") setChapters(c.value);
      else {
        console.warn("[Home] listChapters failed:", c.reason);
        setChapters([]);
      }

      if (s.status === "rejected" && p.status === "rejected" && c.status === "rejected") {
        const msg = "Failed to load homepage content. Please refresh.";
        setError(msg);
        addToast({ type: "error", message: msg });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (params.get("signed_out") === "1") {
      addToast({ type: "success", message: "You’ve been signed out." });
      params.delete("signed_out");
      setParams(params, { replace: true });
    }
    if (params.get("error") || params.get("error_description")) {
      const description = params.get("error_description") || params.get("error");
      addToast({
        type: "error",
        message: description ? decodeURIComponent(description) : "Authentication failed.",
      });
      params.delete("error");
      params.delete("error_description");
      setParams(params, { replace: true });
    }
  }, [params, setParams, addToast]);

  const stats = useMemo(
    () => ({
      projects: settings?.projects_count ?? 0,
      chapters: settings?.chapters_count ?? 0,
      members: settings?.members_count ?? 0,
    }),
    [settings]
  );

  return (
    <div ref={scope}>
      {/* ================= HERO ================= */}
      {/* Full-bleed breakout wrapper (forces bg to reach viewport edges) */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-[100vw] max-w-none">
        <section className="relative -mt-16 overflow-hidden pt-[calc(4.5rem+4rem)] pb-20 sm:pt-[calc(4rem+6rem)] sm:pb-28">

          {/* --- Dominant right image (monochrome + subtle) --- */}
          <div className="absolute inset-0 -z-30 ">
            <img
              src={heroRight}
              alt=""
              className="h-full w-full object-cover object-[60%_50%] grayscale opacity-40 scale-105"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* --- Gradient masks + readability layers (tuned for dual images) --- */}
          <div className="absolute inset-0 -z-20">
            {/* Left lock: keep typography zone clean; let image live on right */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/45 to-transparent to-50%" />
            {/* Gentle top fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/45 to-white/80" />
            {/* Subtle left soften so left image feels intentional */}
            <div className="absolute inset-0 bg-gradient-to-l from-white/70 via-white/45 to-transparent to-50%" />
            {/* Gentle vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_20%,rgba(2,6,23,0.06),transparent_65%)]" />
            {/* Gentle bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-white/40 to-transparent" />
          </div>

          {/* --- Three.js (kept extremely subtle, decorative only) --- */}
          <Suspense fallback={null}>
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]">
              <HeroBackground />
            </div>
          </Suspense>

          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <h1
                data-reveal
                className="mt-3 [font-family:var(--font-display)] text-5xl leading-[0.95] tracking-[-0.03em] sm:text-6xl"
              >
                Make youth service feel{" "}
                <span className="text-[rgb(var(--accent))]">inevitable</span>.
              </h1>

              <p
                data-reveal
                className="mx-auto mt-8 max-w-xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8"
              >
                Youth Service Philippines connects volunteers, chapters, and programs into a
                modern service portal—so meaningful action is always one click away.
              </p>

              <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
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
              </div>

              {/* Stats */}
              <div
                data-reveal
                className="mx-auto mt-12 grid max-w-2xl gap-3 rounded-3xl border border-black/10 bg-white/70 p-4 backdrop-blur sm:grid-cols-3 sm:p-5"
              >
                <Stat label="Projects" value={stats.projects} />
                <Stat label="Chapters" value={stats.chapters} />
                <Stat label="Members" value={stats.members} />
              </div>

            </div>
          </Container>
        </section>
      </div>

      {/* ================= PROGRAMS ================= */}
      <Section
        eyebrow="Programs"
        title="Programs built for real, measurable impact"
        description="Curated initiatives designed for clarity and momentum."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {programs.map((p) => (
            <Link key={p.id} to={`/programs/${p.id}`} data-reveal>
              <Card className="group overflow-hidden border-black/10 bg-white transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-2)]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-70" />
                  <img
                    src={p.image_url ?? FALLBACK_PROGRAM_IMAGE}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-6">
                  <div className="text-base font-semibold">{p.title}</div>
                  <p className="mt-3 text-sm text-black/65">{p.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* ================= CHAPTERS ================= */}
      <Section
        eyebrow="Chapters"
        title="A growing chapter network"
        description="Youth-led chapters across the Philippines."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {chapters.map((c) => (
            <Card
              key={c.id}
              data-reveal
              className="border-black/10 bg-white/75 p-6 transition-all hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(2,6,23,0.1)]"
            >
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-1 text-sm text-black/60">{c.location ?? "Philippines"}</div>
            </Card>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-black/45">{label}</div>
      <div className="mt-2 text-4xl font-semibold tabular-nums tracking-[-0.03em]">
        {value}
      </div>
    </div>
  );
}
