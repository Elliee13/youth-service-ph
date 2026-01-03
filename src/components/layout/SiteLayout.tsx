import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SkipToContent } from "../ui/SkipToContent";
import { useHeaderChrome } from "../../hooks/useHeaderChrome";
import { PageTransition } from "../motion/PageTransition";
import { useScrollToTop } from "../../hooks/useScrollToTop";

export function SiteLayout() {
  useHeaderChrome();
  useScrollToTop();

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg))] text-[rgb(var(--fg))] [font-family:var(--font-sans)]">
      <SkipToContent />
      <Header />

      <main id="main" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="py-20">
              <div className="h-6 w-48 rounded bg-black/5" />
              <div className="mt-4 h-4 w-80 rounded bg-black/5" />
            </div>
          }
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
