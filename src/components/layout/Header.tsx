import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import yspLogo from "../../assets/ysp-logo.png";
import { Button } from "../ui/Button";
import { useAuth } from "../../auth/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/shadcn/dialog";

const nav = [
  { label: "Home", to: "/" },
  { label: "Programs", to: "/programs" },
  { label: "Membership and Chapter", to: "/membership-and-chapter" },
  { label: "Volunteer Opportunities", to: "/volunteer-opportunities" },
  { label: "Contact", to: "/contact" },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
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
          {!user ? (
            <>
              <Link to="/register">
                <Button variant="secondary" size="sm">
                  Volunteer
                </Button>
              </Link>
            </>
          ) : null}
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
          {!user ? (
            <Link to="/register">
              <Button size="sm" className="accent-glow">
                Volunteer
              </Button>
            </Link>
          ) : null}
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/80 text-black/75 transition hover:bg-white hover:text-black"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="left-auto right-0 top-0 h-dvh w-full max-w-sm translate-x-0 translate-y-0 rounded-none border-l border-black/10 bg-white p-0 shadow-2xl">
              <div className="flex h-full flex-col">
                <DialogHeader className="border-b border-black/10 px-5 py-5 text-left">
                  <DialogTitle className="[font-family:var(--font-display)] text-2xl tracking-[-0.02em]">
                    Navigation
                  </DialogTitle>
                  <DialogDescription className="text-sm text-black/60">
                    Browse public pages and quick account actions.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <nav className="grid gap-2" aria-label="Mobile primary">
                    {nav.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          [
                            "rounded-2xl border px-4 py-3 text-sm transition",
                            isActive
                              ? "border-[rgba(255,119,31,0.30)] bg-[rgba(255,119,31,0.10)] text-black"
                              : "border-black/10 text-black/70 hover:bg-black/5 hover:text-black",
                          ].join(" ")
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                </div>

                <div className="border-t border-black/10 px-5 py-5">
                  <div className="grid gap-3">
                    {showPublicAccount ? (
                      <Link to="/my-account" onClick={() => setMobileOpen(false)}>
                        <Button variant="secondary" size="sm" className="w-full">
                          My Account
                        </Button>
                      </Link>
                    ) : null}
                    {!user ? (
                      <Link to="/register" onClick={() => setMobileOpen(false)}>
                        <Button variant="secondary" size="sm" className="w-full">
                          Volunteer
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
