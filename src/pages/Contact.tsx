import { useRef } from "react";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { useGsapReveal } from "../hooks/useGsapReveal";

export default function Contact() {
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
              Contact
            </div>
            <h1
              data-reveal
              className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl"
            >
              Calm, clear, and{" "}
              <span className="text-[rgb(var(--accent))]">responsive</span>.
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-2xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
            >
              Reach out for partnerships, chapter support, or volunteer coordination.
            </p>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="Reach us"
        title="Get in touch"
        description="Intentional, trustworthy presentation of contact channels."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Card data-reveal className="border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Email
            </div>
            <div className="mt-3 text-sm font-semibold">phyouthservice@gmail.com</div>
            <a
              className="mt-3 inline-flex items-center gap-2 text-sm text-[rgb(var(--accent))] hover:underline"
              href="mailto:phyouthservice@gmail.com"
            >
              Send an email <span aria-hidden="true">→</span>
            </a>
          </Card>

          <Card data-reveal className="border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Facebook
            </div>
            <div className="mt-3 text-sm font-semibold">Youth Service Philippines</div>
            <a
              className="mt-3 inline-flex items-center gap-2 text-sm text-[rgb(var(--accent))] hover:underline"
              href="https://www.facebook.com/YOUTHSERVICEPHILIPPINES"
              target="_blank"
              rel="noreferrer"
            >
              Visit page <span aria-hidden="true">↗</span>
            </a>
          </Card>

          <Card data-reveal className="border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Mobile
            </div>
            <div className="mt-3 text-sm font-semibold">09177798413</div>
            <a
              className="mt-3 inline-flex items-center gap-2 text-sm text-[rgb(var(--accent))] hover:underline"
              href="tel:+639177798413"
            >
              Call now <span aria-hidden="true">→</span>
            </a>
          </Card>
        </div>
      </Section>
    </div>
  );
}
