import { useEffect, useState } from 'react';
import { Home, FileText, LogOut, BarChart3, Users, Trophy, User as UserIcon, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { clearAuth } from '../lib/api';
import {
  AppNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../lib/notifications';

interface SidebarProps {
  role?: 'user' | 'admin';
}

export function Sidebar({ role = 'user' }: SidebarProps) {
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

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

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const data = await getMyNotifications(8);

        if (!isMounted) {
          return;
        }

        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch (_error) {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (isMounted) {
          setIsLoadingNotifications(false);
        }
      }
    }

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (_error) {
      // Ignore silent failure and keep current UI state.
    }
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } catch (_error) {
        // Ignore silent failure and still navigate user.
      }
    }

    navigate(`/paper/${notification.paper._id}`);
  };

  const formatNotificationTime = (value: string) => {
    return new Date(value).toLocaleString();
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-border flex flex-col">
      <div className="h-44 flex items-center justify-center px-0 py-0">
        <div className="h-44 overflow-hidden flex items-center justify-center px-0 py-0 bg-white">
          <img src={logo} alt="LiemResearch" className="w-full h-full object-contain scale-[1.35]" />
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="mb-4 rounded-lg border border-border bg-white p-3">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-foreground">
              <Bell size={18} />
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="min-w-6 h-6 px-2 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {isLoadingNotifications && (
                  <p className="text-sm text-muted-foreground">Loading notifications...</p>
                )}

                {!isLoadingNotifications && notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                )}

                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleOpenNotification(notification)}
                    className={`w-full text-left rounded-lg border p-2 transition-colors ${
                      notification.isRead
                        ? 'bg-white border-border hover:bg-accent'
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <p className="text-sm text-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatNotificationTime(notification.createdAt)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigate(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.isLogout
                      ? 'text-red-600 hover:bg-red-50'
                      : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
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
