interface AppHeaderProps {
  role?: 'user' | 'admin';
}

export function AppHeader({ role = 'user' }: AppHeaderProps) {
  void role;

  return null;
}
