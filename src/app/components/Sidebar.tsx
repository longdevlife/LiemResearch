import { Home, FileText, LogOut, BarChart3, Users, Trophy, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { clearAuth } from '../lib/api';

interface SidebarProps {
  role?: 'user' | 'admin';
}

export function Sidebar({ role = 'user' }: SidebarProps) {
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (item: { path: string; isLogout?: boolean }) => {
    if (item.isLogout) {
      clearAuth();
    }

    navigate(item.path);
  };

  const userMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'My Requests', path: '/my-requests' },
    { icon: Trophy, label: 'Rankings', path: '/rankings' },
    { icon: UserIcon, label: 'Profile', path: '/profile' },
    { icon: LogOut, label: 'Logout', path: '/login', isLogout: true },
  ];

  const adminMenuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin' },
    { icon: FileText, label: 'Paper Management', path: '/admin/papers' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: LogOut, label: 'Logout', path: '/login', isLogout: true },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <div className="w-64 h-screen bg-white border-r border-border flex flex-col">
      <div className="h-44 flex items-center justify-center px-0 py-0">
        <div className="h-44 overflow-hidden flex items-center justify-center px-0 py-0 bg-white">
          <img src={logo} alt="LiemResearch" className="w-full h-full object-contain scale-[1.35]" />
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigate(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                    item.isLogout
                      ? 'text-red-600 hover:bg-red-50'
                      : isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
