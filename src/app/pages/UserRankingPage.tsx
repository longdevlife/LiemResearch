import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Trophy, Medal, Award, FileText, Star, Upload } from 'lucide-react';
import { apiRequest, AuthUser } from '../lib/api';

interface UserRank {
  rank: number;
  user: AuthUser;
  uploadedPapers: number;
  uploadedPdfs: number;
  ratingsGiven: number;
  rejectedPapers: number;
  rejectedPdfs: number;
  points: number;
}

export function UserRankingPage() {
  const [rankings, setRankings] = useState<UserRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRankings() {
      setIsLoading(true);
      setError('');

      try {
        const data = await apiRequest<{ rankings: UserRank[] }>('/rankings/top', { auth: true });
        if (isMounted) setRankings(data.rankings);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load rankings');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRankings();

    return () => {
      isMounted = false;
    };
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={24} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={24} className="text-gray-400" />;
    if (rank === 3) return <Award size={24} className="text-amber-700" />;
    return <span className="text-foreground">{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 border-gray-300';
    if (rank === 3) return 'bg-amber-100 border-amber-300';
    return 'bg-white';
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="user" />

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-foreground mb-2">User Rankings</h1>
            <p className="text-muted-foreground">Top contributors ranked by papers, PDFs, and ratings</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
              <p className="text-muted-foreground">Loading rankings...</p>
            </div>
          )}

          {!isLoading && rankings.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {rankings.slice(0, 3).map((item) => (
                  <div
                    key={item.user._id}
                    className={`bg-white rounded-lg border-2 ${getRankBadgeColor(item.rank)} shadow-lg p-6 text-center`}
                  >
                    <div className="flex justify-center mb-4">
                      {getRankIcon(item.rank)}
                    </div>
                    <h3 className="text-foreground mb-1">{item.user.fullName}</h3>
                    <p className="text-muted-foreground mb-2">{item.user.university}</p>
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg mb-4">
                      <span className="text-2xl">{item.points}</span>
                      <span className="ml-1">points</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-left">
                      <div>
                        <p className="text-muted-foreground">Papers</p>
                        <p className="text-foreground flex items-center gap-1">
                          <FileText size={16} className="text-green-600" />
                          {item.uploadedPapers}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">PDFs</p>
                        <p className="text-foreground flex items-center gap-1">
                          <Upload size={16} className="text-blue-600" />
                          {item.uploadedPdfs}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ratings</p>
                        <p className="text-foreground flex items-center gap-1">
                          <Star size={16} className="text-yellow-500" />
                          {item.ratingsGiven}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-foreground">Rank</th>
                        <th className="px-6 py-4 text-left text-foreground">Name</th>
                        <th className="px-6 py-4 text-left text-foreground">University</th>
                        <th className="px-6 py-4 text-left text-foreground">Papers</th>
                        <th className="px-6 py-4 text-left text-foreground">PDFs</th>
                        <th className="px-6 py-4 text-left text-foreground">Ratings</th>
                        <th className="px-6 py-4 text-left text-foreground">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((item) => (
                        <tr
                          key={item.user._id}
                          className={`border-b border-border hover:bg-accent transition-colors ${
                            item.rank <= 3 ? getRankBadgeColor(item.rank) : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getRankIcon(item.rank)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-foreground">{item.user.fullName}</p>
                              <p className="text-muted-foreground">ID: {item.user.studentId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{item.user.university}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-green-600">
                              <FileText size={16} />
                              <span>{item.uploadedPapers}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Upload size={16} className="text-blue-600" />
                              <span className="text-foreground">{item.uploadedPdfs}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Star size={16} className="fill-yellow-400 text-yellow-400" />
                              <span className="text-foreground">{item.ratingsGiven}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full">
                              {item.points}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!isLoading && rankings.length === 0 && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
              <Trophy size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-foreground mb-2">No rankings yet</h3>
              <p className="text-muted-foreground">Rankings will appear after valid uploads or ratings.</p>
            </div>
          )}

          <div className="mt-8 bg-white rounded-lg border border-border shadow-sm p-6">
            <h3 className="text-foreground mb-4">How Points Are Calculated</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-green-600" />
                  <h4 className="text-foreground">Valid Paper Upload</h4>
                </div>
                <p className="text-muted-foreground">+50 points per approved paper, -10 if rejected</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Upload size={20} className="text-blue-600" />
                  <h4 className="text-foreground">Valid PDF Upload</h4>
                </div>
                <p className="text-muted-foreground">+50 points per accepted PDF, -10 if rejected</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={20} className="text-yellow-600" />
                  <h4 className="text-foreground">Paper Rating</h4>
                </div>
                <p className="text-muted-foreground">+5 points per rating given</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
