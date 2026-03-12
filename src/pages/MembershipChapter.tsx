import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { listChapters, type Chapter } from "../lib/public.api";
import { useToast } from "../components/ui/useToast";
import { useAuth } from "../auth/useAuth";
import { AuthRequiredDialog } from "../components/auth/AuthRequiredDialog";

const MEMBERSHIP_FORM_FALLBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdwMKgIjQNrlLH-j-Qdx0MrKxefxaLRC6gMI_oOgMTosDi_sQ/viewform";

const CHAPTER_FORM_FALLBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSefJ0IY39AUBd89A9VC0bojAQSPMXIqas9idU2gRxlSdg3Zkw/viewform";

type GoogleFormCardProps = {
  title: string;
  fallbackUrl: string;
  description: string;
  buttonLabel: string;
  canOpen: boolean;
  onRequireAuth: () => void;
};
type QueryState = "loading" | "error" | "empty" | "ready";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function GoogleFormCard({
  title,
  fallbackUrl,
  description,
  buttonLabel,
  canOpen,
  onRequireAuth,
}: GoogleFormCardProps) {
  return (
    <div className="flex min-h-[320px] flex-col">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-3 text-sm leading-6 text-black/65">{description}</p>
      <div className="mt-5 rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/65">
        The application form opens in a new tab so you can complete it without leaving this page.
      </div>
      <div className="mt-auto pt-6">
        {canOpen ? (
          <a href={fallbackUrl} target="_blank" rel="noreferrer">
            <Button size="lg" className="accent-glow w-full sm:w-auto">
              {buttonLabel}
            </Button>
          </a>
        ) : (
          <Button size="lg" className="accent-glow w-full sm:w-auto" onClick={onRequireAuth}>
            {buttonLabel}
          </Button>
        )}
      </div>
      <p className="mt-4 text-xs text-black/60">
        {canOpen ? (
          <>
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
          </>
        ) : (
          <>
            Sign in or create an account first to access the application form.
          </>
        )}
      </p>
    </div>
  );
}

export default function MembershipChapter() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [queryState, setQueryState] = useState<QueryState>("loading");
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (import.meta.env.DEV) {
        console.warn("[MembershipChapter] fetch start.");
      }
      try {
        const c = await listChapters();
        if (!alive) return;
        setChapters(c);
        const nextQueryState = c.length === 0 ? "empty" : "ready";
        if (import.meta.env.DEV) {
          console.warn("[MembershipChapter] request outcomes.", {
            successCount: c.length,
            errorMessage: null,
            finalQueryState: nextQueryState,
          });
        }
        setQueryState(nextQueryState);
      } catch (e: unknown) {
        if (!alive) return;
        console.warn("[MembershipChapter] listChapters failed:", e);
        const msg = getErrorMessage(e, "Failed to load chapters.");
        addToast({ type: "error", message: msg });
        if (import.meta.env.DEV) {
          console.warn("[MembershipChapter] request outcomes.", {
            successCount: 0,
            errorMessage: msg,
            finalQueryState: "error",
          });
        }
        setQueryState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [addToast]);

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
        title="Apply as a member or launch a chapter"
        description="Choose the path that fits you best. Both forms open in a new tab so you can complete them without losing your place."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-reveal className="border-black/10 bg-white/70 p-6 sm:p-8">
            <GoogleFormCard
              title="Membership form"
              fallbackUrl={MEMBERSHIP_FORM_FALLBACK_URL}
              description="Fill out the membership application and our team will review your submission."
              buttonLabel="Open Membership Form"
              canOpen={Boolean(user)}
              onRequireAuth={() => setAuthPromptOpen(true)}
            />
          </Card>

          <Card data-reveal className="border-black/10 bg-white/70 p-6 sm:p-8">
            <GoogleFormCard
              title="Chapter proposal form"
              fallbackUrl={CHAPTER_FORM_FALLBACK_URL}
              description="Submit your chapter proposal. We’ll contact you if approved."
              buttonLabel="Open Chapter Proposal Form"
              canOpen={Boolean(user)}
              onRequireAuth={() => setAuthPromptOpen(true)}
            />
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
            {queryState === "loading" ? (
              <div className="mt-4 text-sm text-black/60">Loading chapters...</div>
            ) : queryState === "error" ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div>Failed to load chapters.</div>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold underline underline-offset-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : queryState === "empty" ? (
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

      <AuthRequiredDialog open={authPromptOpen} onOpenChange={setAuthPromptOpen} />
    </div>
  );
}
