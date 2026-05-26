import { Link } from 'react-router';
import { NotificationBell } from './NotificationBell';

interface AppHeaderProps {
  role?: 'user' | 'admin';
}

export function AppHeader({ role = 'user' }: AppHeaderProps) {
  const workspacePath = role === 'admin' ? '/admin' : '/dashboard';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-8 py-4">
        <Link to={workspacePath} className="cursor-pointer transition-opacity hover:opacity-80">
          <p className="text-foreground">LiemResearch</p>
          <p className="text-sm text-muted-foreground">
            {role === 'admin' ? 'Administration workspace' : 'Research workspace'}
          </p>
        </Link>

        <NotificationBell />
      </div>
    </header>
  );
}
