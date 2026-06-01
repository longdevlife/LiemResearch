import { Home, FileText, LogOut, BarChart3, Users, Trophy, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { clearAuth } from '../lib/api';

interface SidebarProps {
  role?: 'user' | 'admin';
}

export function Sidebar({ role = 'user' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (item: { path: string; isLogout?: boolean }) => {
    if (item.isLogout) clearAuth();
    navigate(item.path);
  };

  const userMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'My Requests', path: '/my-requests' },
    { icon: Trophy, label: 'Rankings', path: '/rankings' },
    { icon: UserIcon, label: 'Profile', path: '/profile' },
  ];

  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: BarChart3, label: 'Statistics', path: '/admin/stats' },
    { icon: FileText, label: 'Paper Management', path: '/admin/papers' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: UserIcon, label: 'Profile', path: '/admin/profile' },
  ];

  const navigationItems = role === 'admin' ? adminMenuItems : userMenuItems;
  const logoutItem = { icon: LogOut, label: 'Logout', path: '/login', isLogout: true };

  return (
    <aside className="sticky top-0 z-30 border-b border-[#dfd4c7] bg-[#fffaf4]/95 pt-16 backdrop-blur md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r md:pt-[73px]">
      <nav className="overflow-x-auto px-3 py-3 md:overflow-visible md:px-4 md:py-5">
        <div className="flex min-w-max gap-1 md:block md:min-w-0 md:space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:w-full ${
                  isActive
                    ? 'bg-[#2f251f] text-[#fffaf4]'
                    : 'text-[#1f1a17] hover:bg-[#f3ebe1]'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => handleNavigate(logoutItem)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 md:hidden"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      <div className="hidden md:absolute md:bottom-4 md:left-4 md:right-4 md:block">
        <button
          onClick={() => handleNavigate(logoutItem)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
