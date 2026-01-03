import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export function useScrollToTop() {
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [pathname, reduced]);
}
