import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-white px-3 py-1 text-xs text-black/70">
      <span className="size-1.5 rounded-full bg-[rgb(var(--accent))]" />
      {children}
    </span>
  );
}
