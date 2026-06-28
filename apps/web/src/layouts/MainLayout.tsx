import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, User, Search, Bell, Sparkles, Plus, Bookmark, Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useBookmarks } from "@/features/bookmarks";
import { useNotifications } from "@/features/notifications";
import { cn } from "@/utils/cn";

const navItems = [
  { to: "/search", label: "Search" },
  { to: "/trends", label: "Trends" },
  { to: "/reports", label: "Reports" },
  { to: "/research-gaps", label: "Research Gaps" },
  { to: "/projects", label: "Projects" },
  { to: "/rankings", label: "Rankings" },
] as const;


export function MainLayout() {
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => !!s.tokens?.accessToken);
  const user = useAuthStore((s) => s.user);
  const { data: bookmarks } = useBookmarks({ enabled: isAuthed });
  const { data: notifications } = useNotifications({ enabled: isAuthed });
  const { data: currentUserData } = useCurrentUser();

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const validBookmarksCount = bookmarks?.filter((b) => {
    if (b.targetKind === "paper") return !!b.paperDetail;
    if (b.targetKind === "report") return !!b.reportDetail;
    return false;
  }).length || 0;

  const filteredNavItems = navItems;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#09090b]">
      <header className="border-b bg-white dark:bg-[#0f0f11] sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-[#001b69] dark:text-blue-400 tracking-tight shrink-0">
              Publication Trend
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex-1 max-w-2xl hidden md:flex items-center mx-4">
            <form
              className="relative w-full"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q")?.toString().trim();
                if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                name="q"
                className="w-full pl-9 rounded-full bg-slate-100 dark:bg-zinc-900 border-none h-10 focus-visible:ring-1"
                placeholder="Search papers, authors, topics..."
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthed && (
              <Button variant="ghost" size="icon" className="rounded-full text-slate-500 dark:text-slate-400 relative" asChild>
                <Link to="/bookmarks" aria-label="Bookmarks">
                  <Bookmark className="h-5 w-5" />
                  {validBookmarksCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[18px] items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0f0f11] px-1">
                      {validBookmarksCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 dark:text-slate-400 relative" asChild>
              <Link to="/notifications" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0f0f11] px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Outlet />
      </main>
      <footer className="border-t bg-white dark:bg-[#0f0f11] py-6 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 Publication Trend. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="#" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</Link>
            <Link to="#" className="hover:text-slate-900 dark:hover:text-white">Terms of Service</Link>
            <Link to="#" className="hover:text-slate-900 dark:hover:text-white">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function UserMenu() {
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => !!s.tokens?.accessToken);
  const { data } = useCurrentUser();
  const logout = useLogout();

  if (!isAuthed) {
    return (
      <>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/login">Sign in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/register">Sign up</Link>
        </Button>
      </>
    );
  }

  const email = data?.user?.email ?? "Account";
  const fullName = data?.user?.fullName || email;
  const role = data?.user?.role;
  const credits = data?.user?.credits ?? 0;
  const points = data?.user?.points ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[9999]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-slate-900 dark:text-white truncate">{fullName}</p>
            <p className="text-xs leading-none text-slate-500 truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        {role !== "admin" && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 space-y-1.5 bg-slate-50/50 dark:bg-zinc-900/30 rounded-md animate-fadeIn">
              <div className="flex justify-between items-center">
                <span>Balance:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{credits.toLocaleString()} credits</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Points:</span>
                <span className="text-amber-600 dark:text-amber-500 font-bold">{points.toLocaleString()} pts</span>
              </div>
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          Profile
        </DropdownMenuItem>
        {role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/admin/sync")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Admin
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout.mutate(undefined, {
              onSettled: () => navigate("/login", { replace: true }),
            });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
