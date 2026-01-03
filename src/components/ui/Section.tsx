import type { ReactNode } from "react";
import { Container } from "./Container";

export function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="py-14 sm:py-18">
      <Container>
        <div className="max-w-2xl">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              {eyebrow}
            </div>
          ) : null}

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            {title}
          </h2>

          {description ? (
            <p className="mt-4 text-[15px] leading-7 text-black/65 sm:text-base sm:leading-8">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}
