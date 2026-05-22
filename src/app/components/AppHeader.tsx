import { NotificationBell } from './NotificationBell';

interface AppHeaderProps {
  role?: 'user' | 'admin';
}

export function AppHeader({ role = 'user' }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-8 py-4">
        <div>
          <p className="text-foreground">LiemResearch</p>
          <p className="text-sm text-muted-foreground">
            {role === 'admin' ? 'Administration workspace' : 'Research workspace'}
          </p>
        </div>

        <NotificationBell />
      </div>
    </header>
  );
}
