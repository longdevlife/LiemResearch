import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, User, Search, Bell, Sparkles } from "lucide-react";

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
import { cn } from "@/utils/cn";

const navItems = [
  { to: "/search", label: "Search" },
  { to: "/trends", label: "Trends" },
  { to: "/reports", label: "Reports" },
  { to: "/projects", label: "Projects" },
] as const;

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#09090b]">
      <header className="border-b bg-white dark:bg-[#0f0f11] sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-blue-700 dark:text-blue-500 tracking-tight">
              Publication Trend
            </Link>
          </div>
          
          <div className="flex-1 max-w-2xl hidden md:flex items-center mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="w-full pl-9 rounded-full bg-slate-100 dark:bg-zinc-900 border-none h-10 focus-visible:ring-1" 
                placeholder="Search papers, authors, topics..." 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 dark:text-slate-400 relative" asChild>
              <Link to="/notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-[#0f0f11]"></span>
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
          <p>© 2024 Publication Trend. All rights reserved.</p>
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[9999]">
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          Profile
        </DropdownMenuItem>
        {role === "admin" && (
          <>
            <DropdownMenuSeparator />
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
