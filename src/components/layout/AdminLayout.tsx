import { Suspense, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CalendarClock,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "../ui/shadcn/button";
import { Badge } from "../ui/shadcn/badge";
import { Separator } from "../ui/shadcn/separator";
import { PageTransition } from "../motion/PageTransition";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { useAuth } from "../../auth/useAuth";
import { NotificationBell } from "../notifications/NotificationBell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/shadcn/dialog";

type AdminNavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  to: string;
  end?: boolean;
};

const navItems: AdminNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin", end: true },
  { label: "Programs", icon: FolderKanban, to: "/admin/programs" },
  { label: "Chapters", icon: Users, to: "/admin/chapters" },
  { label: "Opportunities", icon: CalendarClock, to: "/admin/opportunities" },
  { label: "Volunteers", icon: Users, to: "/admin/volunteers" },
  { label: "Staff", icon: ShieldCheck, to: "/admin/staff" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
];

export function AdminLayout() {
  useScrollToTop();

  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="h-dvh overflow-hidden bg-[rgb(var(--bg))] text-[rgb(var(--fg))] [font-family:var(--font-sans)]">
      <div className="flex h-dvh">
        <aside className="hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r bg-white/80 p-4 backdrop-blur lg:flex">
          <Link to="/admin" className="rounded-lg px-2 py-1">
            <div className="text-xs uppercase tracking-[0.18em] text-black/45">Admin Zone</div>
            <div className="mt-1 text-lg font-semibold">Control Center</div>
          </Link>

          <Separator className="my-4" />

          <nav className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-[rgba(255,119,31,0.12)] text-black"
                        : "text-black/70 hover:bg-black/5 hover:text-black",
                    ].join(" ")
                  }
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                  {item.label === "Dashboard" ? <Badge variant="outline" className="ml-auto">Live</Badge> : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto pt-4">
            <Separator className="mb-4" />
            <Button type="button" variant="secondary" className="w-full justify-start bg-red-200 hover:bg-red-300" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
            <div className="container mx-auto flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-black/45">Staff / Admin</div>
                <div className="text-sm font-medium text-black/80">{location.pathname}</div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Link to="/admin/announcements">
                  <Button type="button" size="sm" className="accent-glow hidden sm:inline-flex">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Make announcement
                  </Button>
                </Link>
                <Link to="/admin/announcements">
                  <Button
                    type="button"
                    size="icon"
                    className="accent-glow sm:hidden"
                    aria-label="Make announcement"
                  >
                    <Megaphone className="h-4 w-4" />
                  </Button>
                </Link>
              <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/80 text-black/75 transition hover:bg-white hover:text-black lg:hidden"
                    aria-label="Open admin menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="left-0 top-0 h-dvh w-full max-w-xs translate-x-0 translate-y-0 rounded-none border-r border-black/10 bg-white p-0 shadow-2xl">
                  <div className="flex h-full flex-col">
                    <DialogHeader className="border-b border-black/10 px-5 py-5 text-left">
                      <DialogTitle className="[font-family:var(--font-display)] text-2xl tracking-[-0.02em]">
                        Admin Menu
                      </DialogTitle>
                      <DialogDescription className="text-sm text-black/60">
                        Navigate the admin workspace.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-5">
                      <nav className="grid gap-1">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.label}
                              to={item.to}
                              end={item.end}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                [
                                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                                  isActive
                                    ? "bg-[rgba(255,119,31,0.12)] text-black"
                                    : "text-black/70 hover:bg-black/5 hover:text-black",
                                ].join(" ")
                              }
                            >
                              <Icon className="size-4" />
                              <span>{item.label}</span>
                              {item.label === "Dashboard" ? (
                                <Badge variant="outline" className="ml-auto">
                                  Live
                                </Badge>
                              ) : null}
                            </NavLink>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="border-t border-black/10 px-4 py-4">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full justify-start bg-red-200 hover:bg-red-300"
                        onClick={() => {
                          setMobileOpen(false);
                          signOut();
                        }}
                      >
                        Sign out
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </header>

          <main className="container mx-auto min-w-0 flex-1 overflow-y-auto p-6">
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
        </div>
      </div>
    </div>
  );
}
