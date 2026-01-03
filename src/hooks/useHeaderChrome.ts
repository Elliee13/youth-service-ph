import { useLayoutEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export function useHeaderChrome() {
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;

    const header = document.querySelector<HTMLElement>("[data-header]");
    if (!header) return;

    const st = ScrollTrigger.create({
      start: 10,
      end: 99999,
      onUpdate: (self) => {
        const scrolled = self.scroll() > 8;
        header.classList.toggle(
          "shadow-[0_10px_30px_rgba(2,6,23,0.08)]",
          scrolled
        );
        header.classList.toggle("bg-white/70", scrolled);
        header.classList.toggle("bg-white/55", !scrolled);
      },
    });

    return () => st.kill();
  }, [reduced]);
}
