import React from "react";
import { Card } from "../ui/Card";

export function DataTable({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-black/10 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            {title}
          </div>
          {description ? (
            <div className="mt-2 text-sm text-black/65">{description}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[720px]">{children}</div>
      </div>
    </Card>
  );
}
