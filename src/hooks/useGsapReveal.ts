import { useLayoutEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export function useGsapReveal(scope: React.RefObject<HTMLElement | null>) {
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
      targets.forEach((t, index) => {
        gsap.fromTo(
          t,
          { y: 14, opacity: 0, filter: "blur(8px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.75,
            ease: "power3.out",
            delay: Math.min(index * 0.03, 0.12),
            scrollTrigger: {
              trigger: t,
              start: "top 88%",
              once: true,
            },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, [scope, reduced]);
}
