import type { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Array<string | undefined | false>) {
  return twMerge(clsx(inputs));
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/10 bg-white shadow-[var(--shadow)]",
        className
      )}
    >
      {children}
    </div>
  );
}
