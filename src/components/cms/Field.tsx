import React from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <label className="text-xs font-semibold text-black/70">{label}</label>
        {hint ? <div className="text-xs text-black/45">{hint}</div> : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition",
        "focus:border-[rgba(255,119,31,0.45)]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-[96px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition",
        "focus:border-[rgba(255,119,31,0.45)]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
