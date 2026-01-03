import { Link } from "react-router-dom";
import yspLogo from "../../assets/ysp-logo.png";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-[rgb(var(--card))]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:px-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={yspLogo}
              alt="Youth Service Philippines"
              className="h-10 w-auto rounded-2xl"
              loading="lazy"
            />
            <div className="text-sm font-semibold">Youth Service Philippines</div>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-black/60">
            A modern youth volunteer portal for programs, chapters, and service opportunities.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold">Explore</div>
          <div className="mt-4 grid gap-2 text-sm text-black/70">
            <Link className="hover:text-black" to="/programs">Programs</Link>
            <Link className="hover:text-black" to="/volunteer-opportunities">Volunteer Opportunities</Link>
            <Link className="hover:text-black" to="/membership-and-chapter">Membership and Chapter</Link>
            <Link className="hover:text-black" to="/contact">Contact</Link>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Get involved</div>
          <p className="mt-4 text-sm leading-6 text-black/60">
            Join a chapter, volunteer for events, and create measurable impact aligned with the SDGs.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm backdrop-blur">
            <span className="size-2 rounded-full bg-[rgb(var(--accent))]" />
            <span className="text-black/70">Orange accent system</span>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-xs text-black/55 sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Youth Service Philippines</span>
          <span>React • Tailwind • Three • GSAP • Supabase</span>
        </div>
      </div>
    </footer>
  );
}
