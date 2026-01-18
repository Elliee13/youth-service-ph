import { NavLink, Link } from "react-router-dom";
import yspLogo from "../../assets/ysp-logo.png";
import { Button } from "../ui/Button";
import { useAuth } from "../../auth/AuthProvider";

const nav = [
  { label: "Home", to: "/" },
  { label: "Programs", to: "/programs" },
  { label: "Membership and Chapter", to: "/membership-and-chapter" },
  { label: "Volunteer Opportunities", to: "/volunteer-opportunities" },
  { label: "Contact", to: "/contact" },
] as const;

export function Header() {
  const { user, profile } = useAuth();
  const showPublicAccount = Boolean(user && !profile?.role);

  return (
    <header
      data-header
      className="sticky top-0 z-40 border-b border-black/5 bg-white/55 backdrop-blur-xl transition-shadow duration-300"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={yspLogo}
            alt="Youth Service Philippines"
            className="h-9 w-auto rounded-xl"
            loading="eager"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              Youth Service Philippines
            </div>
            <div className="text-xs text-black/55">Volunteer • Lead • Serve</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "relative rounded-full px-4 py-2 text-sm transition",
                  "text-black/70 hover:text-black",
                  "after:absolute after:inset-x-4 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[rgb(var(--accent))] after:transition-transform after:duration-300",
                  "hover:after:scale-x-100",
                  isActive ? "text-black after:scale-x-100" : "",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {showPublicAccount ? (
            <Link
              to="/my-account"
              className="rounded-full border border-[rgba(255,119,31,0.35)] bg-[rgba(255,119,31,0.10)] px-4 py-1 text-xs font-semibold text-[rgb(var(--accent))] transition hover:bg-[rgba(255,119,31,0.18)]"
            >
              My Account
            </Link>
          ) : null}
          <Link to="/register">
            <Button variant="secondary" size="sm">
              Volunteer
            </Button>
          </Link>
          <Link to="/sign-in?role=admin">
            <Button variant="secondary" size="sm">
              Admin
            </Button>
          </Link>
          <Link to="/sign-in?role=chapter_head">
            <Button size="sm" className="accent-glow">
              Chapter Head
            </Button>
          </Link>
        </div>

        {/* Mobile quick access */}
        <div className="flex items-center gap-2 md:hidden">
          {showPublicAccount ? (
            <Link
              to="/my-account"
              className="rounded-full border border-[rgba(255,119,31,0.35)] bg-[rgba(255,119,31,0.12)] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--accent))]"
            >
              Account
            </Link>
          ) : null}
          <Link to="/register">
            <Button size="sm" className="accent-glow">
              Volunteer
            </Button>
          </Link>
          <Link to="/sign-in?role=chapter_head">
            <Button size="sm" variant="secondary">
              Staff
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile nav (keep structure, improve spacing) */}
      <div className="border-t border-black/5 md:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm transition",
                  isActive ? "bg-black/5 text-black" : "text-black/70 hover:bg-black/5 hover:text-black",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
