import { type PropsWithChildren, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

export function PageTransition({ children }: PropsWithChildren) {
  const reduced = usePrefersReducedMotion();
  const { pathname } = useLocation();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Ensure we start clean
    gsap.killTweensOf(el);

    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    // Subtle “premium” enter transition
    gsap.fromTo(
      el,
      { opacity: 0, y: 10, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.55,
        ease: "power3.out",
        clearProps: "transform",
      }
    );
  }, [pathname, reduced]);

  return (
    <div
      // key forces remount per route so the animation always runs on navigation
      key={pathname}
      ref={wrapRef}
      className="will-change-transform"
    >
      {children}
    </div>
  );
}
