import { Sidebar } from '../components/Sidebar';
import { StatsCard } from '../components/StatsCard';
import { FileText, Download, Clock, Users } from 'lucide-react';

export function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" />

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of research paper requests and system statistics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Requests"
              value="127"
              icon={FileText}
              color="bg-blue-500"
            />
            <StatsCard
              title="Downloaded Papers"
              value="89"
              icon={Download}
              color="bg-green-500"
            />
            <StatsCard
              title="Pending Papers"
              value="28"
              icon={Clock}
              color="bg-amber-500"
            />
            <StatsCard
              title="Total Users"
              value="42"
              icon={Users}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <h3 className="text-foreground mb-4">Recent Requests</h3>
              <div className="space-y-4">
                {[
                  { title: 'Machine Learning in Healthcare', user: 'John Doe', date: '2024-05-20' },
                  { title: 'Deep Neural Networks', user: 'Jane Smith', date: '2024-05-19' },
                  { title: 'Natural Language Processing', user: 'Bob Johnson', date: '2024-05-18' },
                  { title: 'Computer Vision Techniques', user: 'Alice Brown', date: '2024-05-17' },
                ].map((request, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-foreground">{request.title}</p>
                      <p className="text-muted-foreground">{request.user}</p>
                    </div>
                    <span className="text-muted-foreground">{request.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <h3 className="text-foreground mb-4">Request Status Distribution</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground">Downloaded</span>
                    <span className="text-muted-foreground">70%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground">Pending</span>
                    <span className="text-muted-foreground">22%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-amber-500 h-3 rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground">Not Downloaded</span>
                    <span className="text-muted-foreground">8%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-gray-500 h-3 rounded-full" style={{ width: '8%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
