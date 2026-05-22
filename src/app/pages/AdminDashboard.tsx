import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import { StatsCard } from '../components/StatsCard';
import { FileText, Download, Clock, Users } from 'lucide-react';
import { apiRequest, AuthUser } from '../lib/api';
import { PublicPaper } from '../lib/papers';

type DashboardPaper = PublicPaper & {
  requestedBy?: Pick<AuthUser, 'fullName' | 'email'>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function AdminDashboard() {
  const [papers, setPapers] = useState<DashboardPaper[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError('');

      try {
        const [paperData, userData] = await Promise.all([
          apiRequest<{ papers: DashboardPaper[] }>('/papers', { auth: true }),
          apiRequest<{ users: AuthUser[] }>('/users', { auth: true }),
        ]);

        if (isMounted) {
          setPapers(paperData.papers);
          setUsers(userData.users);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load dashboard');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalRequests = papers.length;
  const downloadedPapers = papers.filter((paper) => paper.status === 'downloaded').length;
  const pendingPapers = papers.filter((paper) => paper.status === 'pending').length;
  const notDownloadedPapers = papers.filter((paper) => paper.status === 'not-downloaded' || paper.status === 'approved').length;
  const recentRequests = papers.slice(0, 4);

  const getPercent = (count: number) => {
    if (totalRequests === 0) return 0;
    return Math.round((count / totalRequests) * 100);
  };

  const distribution = [
    { label: 'Downloaded', count: downloadedPapers, color: 'bg-green-500' },
    { label: 'Pending', count: pendingPapers, color: 'bg-amber-500' },
    { label: 'Not Downloaded', count: notDownloadedPapers, color: 'bg-gray-500' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" />

      <div className="flex-1 p-8">
        <AppHeader role="admin" />
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of research paper requests and system statistics</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-6 mb-8">
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Requests"
              value={totalRequests}
              icon={FileText}
              color="bg-blue-500"
            />
            <StatsCard
              title="Downloaded Papers"
              value={downloadedPapers}
              icon={Download}
              color="bg-green-500"
            />
            <StatsCard
              title="Pending Papers"
              value={pendingPapers}
              icon={Clock}
              color="bg-amber-500"
            />
            <StatsCard
              title="Total Users"
              value={users.length}
              icon={Users}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <h3 className="text-foreground mb-4">Recent Requests</h3>
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-foreground">{request.title}</p>
                      <p className="text-muted-foreground">{request.requestedBy?.fullName || 'Unknown user'}</p>
                    </div>
                    <span className="text-muted-foreground">{formatDate(request.createdAt)}</span>
                  </div>
                ))}

                {!isLoading && recentRequests.length === 0 && (
                  <p className="text-muted-foreground">No requests yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <h3 className="text-foreground mb-4">Request Status Distribution</h3>
              <div className="space-y-4">
                {distribution.map((item) => {
                  const percent = getPercent(item.count);

                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-2">
                        <span className="text-foreground">{item.label}</span>
                        <span className="text-muted-foreground">{percent}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className={`${item.color} h-3 rounded-full`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
