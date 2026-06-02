import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, FileText, MessageCircle, Tags } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { LoadingSkeleton } from '../components/LoadingSpinner';
import { apiRequest, AuthUser, getStoredUser } from '../lib/api';
import { formatDisplayDate } from '../lib/date';

type PaperRequest = {
  _id: string;
  status: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserPublicProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [paperCount, setPaperCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiRequest<{ user: AuthUser }>('/auth/me', { auth: true }),
      apiRequest<{ papers: PaperRequest[] }>('/papers/my-requests', { auth: true }).catch(() => ({ papers: [] })),
    ])
      .then(([profileData, paperData]) => {
        if (!isMounted) return;
        setUser(profileData.user);
        setPaperCount(paperData.papers.length);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = getInitials(user?.fullName || '') || 'U';

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      <AppHeader role="user" />

      <main className="pt-16 md:pt-0">
        <div className="h-44 bg-[#211b18] md:h-52" />

        <div className="mx-auto -mt-20 max-w-5xl px-4 pb-10">
          {isLoading ? (
            <LoadingSkeleton variant="profile" />
          ) : (
            <>
              <section className="relative rounded-lg border border-border bg-white px-6 pb-8 pt-24 text-center shadow-sm md:px-10">
                <div className="absolute left-1/2 top-0 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-8 border-[#211b18] bg-[#6f5438] text-5xl font-semibold text-white">
                  {initials}
                </div>

                <Link
                  to="/settings/profile"
                  className="absolute right-5 top-5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                >
                  Edit profile
                </Link>

                <h1 className="text-3xl font-semibold text-foreground">{user?.fullName || 'LiemResearch user'}</h1>
                <p className="mt-3 text-muted-foreground">{user?.university || 'Research community member'}</p>
                <p className="mt-7 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays size={18} />
                  Joined on {formatDisplayDate(user?.createdAt)}
                </p>
              </section>

              <div className="mt-5 grid gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
                <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
                  <ProfileStat icon={FileText} label={`${paperCount} papers contributed`} />
                  <ProfileStat icon={MessageCircle} label="0 comments written" />
                  <ProfileStat icon={Tags} label="0 research tags followed" />
                </section>

                <section className="rounded-lg border border-border bg-white shadow-sm">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-xl font-semibold text-foreground">Recent activity</h2>
                  </div>
                  <p className="px-5 py-8 text-muted-foreground">
                    Your latest paper requests and PDF contributions will appear here.
                  </p>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ProfileStat({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <p className="flex items-center gap-3 py-2 text-muted-foreground">
      <Icon size={20} className="shrink-0" />
      {label}
    </p>
  );
}
