import { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Array<string | undefined | false>) {
  return twMerge(clsx(inputs));
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium " +
    "transition-all duration-200 will-change-transform " +
    "focus-visible:outline-none disabled:opacity-60 disabled:pointer-events-none";

  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary:
      "bg-[rgb(var(--accent))] text-white " +
      "shadow-[0_10px_30px_rgba(255,119,31,0.22)] " +
      "hover:translate-y-[-1px] hover:shadow-[0_16px_44px_rgba(2,6,23,0.14)] " +
      "active:translate-y-0 active:shadow-[0_10px_30px_rgba(2,6,23,0.10)]",
    secondary:
      "border border-black/10 bg-white/70 backdrop-blur " +
      "hover:bg-white hover:border-black/15 " +
      "hover:translate-y-[-1px] active:translate-y-0",
    ghost:
      "text-black/70 hover:text-black hover:bg-black/5",
  };

  const sizes: Record<NonNullable<Props["size"]>, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
