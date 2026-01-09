import React from "react";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { useAuth } from "../../auth/AuthProvider";

export function CmsShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { signOut, profile } = useAuth();

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Dashboard • {profile?.role ?? "user"}
            </div>
            <h1 className="mt-3 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {right}
            <Button variant="secondary" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-10">{children}</div>
      </Container>
    </div>
  );
}
