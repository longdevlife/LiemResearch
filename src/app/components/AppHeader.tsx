import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { getStoredUser } from '../lib/api';

interface AppHeaderProps {
  role?: 'user' | 'admin';
}

export function AppHeader({ role = 'user' }: AppHeaderProps) {
  const logo = new URL('../../imports/liemresearch-logo.png', import.meta.url).href;
  const navigate = useNavigate();
  const user = getStoredUser();
  const workspacePath = role === 'admin' ? '/admin' : '/dashboard';
  const actionPath = role === 'admin' ? '/admin/post-paper' : '/request-paper';
  const actionLabel = role === 'admin' ? 'Post Paper' : 'Request Paper';
  const profilePath = role === 'admin' ? '/admin/profile' : '/profile';
  const [query, setQuery] = useState('');

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(workspacePath, { state: { headerSearch: query.trim() } });
  };

  const initials = user?.fullName
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#dfd4c7] bg-[#fffaf4]/95 backdrop-blur">
        <div className="flex h-16 w-full items-center gap-3 px-4 md:h-[73px] md:px-6">
          <Link
            to={workspacePath}
            onClick={() => window.scrollTo(0, 0)}
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <img src={logo} alt="LiemResearch" className="h-9 w-9 rounded-lg border border-[#e2d6c7] bg-white object-contain p-1 md:h-10 md:w-10" />
            <span className="hidden text-base font-semibold text-[#1f1a17] sm:block">LiemResearch</span>
          </Link>

          <form onSubmit={handleSearch} className="relative min-w-0 flex-1 md:max-w-3xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7b6f]" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search papers..."
              className="w-full rounded-lg border border-[#dfd4c7] bg-white py-2 pl-10 pr-3 text-sm text-[#1f1a17] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(122,111,97,0.12)]"
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <Link
              to={actionPath}
              className="hidden items-center gap-2 rounded-lg border border-[#2f251f] px-3 py-2 text-sm font-semibold text-[#2f251f] transition-colors hover:bg-[#2f251f] hover:text-[#fffaf4] sm:inline-flex"
            >
              <Plus size={17} />
              {actionLabel}
            </Link>

            <NotificationBell />

            <Link
              to={profilePath}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6f5438] text-xs font-semibold text-white transition-opacity hover:opacity-85"
              aria-label="Open profile"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>
      <div className="hidden md:block md:h-[73px]" />
    </>
  );
}
