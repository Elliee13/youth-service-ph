import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { listChapters, type Chapter } from "../lib/public.api";
import { useToast } from "../components/ui/ToastProvider";

const MEMBERSHIP_FORM_EMBED_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdwMKgIjQNrlLH-j-Qdx0MrKxefxaLRC6gMI_oOgMTosDi_sQ/viewform?embedded=true";
const MEMBERSHIP_FORM_FALLBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdwMKgIjQNrlLH-j-Qdx0MrKxefxaLRC6gMI_oOgMTosDi_sQ/viewform";

const CHAPTER_FORM_EMBED_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSefJ0IY39AUBd89A9VC0bojAQSPMXIqas9idU2gRxlSdg3Zkw/viewform?embedded=true";

function toFallbackViewUrl(url: string) {
  return url
    .replace(/[?&]embedded=true(?=&|$)/, "")
    .replace(/[?&]$/, "")
    .replace("?&", "?");
}

const CHAPTER_FORM_FALLBACK_URL = toFallbackViewUrl(CHAPTER_FORM_EMBED_URL);

type GoogleFormEmbedProps = {
  title: string;
  embedUrl: string;
  fallbackUrl: string;
};

function GoogleFormEmbed({ title, embedUrl, fallbackUrl }: GoogleFormEmbedProps) {
  return (
    <div className="overflow-x-hidden">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-4 overflow-hidden rounded-2xl">
        <iframe
          title={title}
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-[720px] w-full rounded-2xl border border-black/10 bg-white sm:h-[900px]"
        />
      </div>
      <p className="mt-3 text-xs text-black/60">
        If the form doesn&apos;t load,{" "}
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[rgb(var(--accent))] hover:underline"
        >
          open it here
        </a>
        .
      </p>
    </div>
  );
}

export default function MembershipChapter() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await listChapters();
        if (!alive) return;
        setChapters(c);
      } catch (e: any) {
        if (!alive) return;
        console.warn("[MembershipChapter] listChapters failed:", e);
        const msg = e?.message ?? "Failed to load chapters.";
        addToast({ type: "error", message: msg });
        setChapters([]);
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
              Membership & Chapter
            </div>
            <h1
              data-reveal
              className="[font-family:var(--font-display)] mt-4 text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl"
            >
              Join the network. Build a chapter.{" "}
              <span className="text-[rgb(var(--accent))]">Lead locally</span>.
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-2xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
            >
              Become a member or request to create a chapter. We’ll review and reach out when approved.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="Become a Member"
        title="Membership application"
        description="Fill out the form below. Our team will review your submission."
      >
        <Card data-reveal className="border-black/10 bg-white/70 p-6 sm:p-8">
          <GoogleFormEmbed
            title="Membership form"
            embedUrl={MEMBERSHIP_FORM_EMBED_URL}
            fallbackUrl={MEMBERSHIP_FORM_FALLBACK_URL}
          />
        </Card>
      </Section>

      <Section
        eyebrow="Create a Chapter"
        title="Request to create a chapter"
        description="Submit your chapter proposal. We’ll contact you if approved."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-reveal className="border-black/10 bg-white/70 p-6 sm:p-8">
            <GoogleFormEmbed
              title="Chapter proposal form"
              embedUrl={CHAPTER_FORM_EMBED_URL}
              fallbackUrl={CHAPTER_FORM_FALLBACK_URL}
            />
          </Card>

          <div className="space-y-4">
            <Card data-reveal className="border-black/10 bg-[rgb(var(--card))] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                Note
              </div>
              <div className="mt-3 text-sm font-semibold">Approval notice</div>
              <p className="mt-2 text-sm leading-6 text-black/65">
                We will contact you if approved.
              </p>
              <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/65">
                Tip: Ensure your contact details are correct so chapter onboarding is smooth.
              </div>
            </Card>

            <Card data-reveal className="border-black/10 bg-white p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                Chapters
              </div>
              {chapters.length === 0 ? (
                <div className="mt-4 text-sm text-black/60">No chapters available yet.</div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {chapters.map((c) => (
                    <div
                      key={c.id}
                      data-reveal
                      className="group rounded-2xl border border-black/10 bg-white/75 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]"
                    >
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="mt-1 text-sm text-black/60">{c.location ?? "Philippines"}</div>
                      <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-black/60">
                        <span className="size-1.5 rounded-full bg-[rgb(var(--accent))]" />
                        View opportunities
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
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
