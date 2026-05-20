import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Trophy, Medal, Award, Upload, Download, Star } from 'lucide-react';

interface UserRank {
  rank: number;
  name: string;
  university: string;
  studentId: string;
  uploadedPapers: number;
  downloadedPapers: number;
  totalRating: number;
  points: number;
}

const mockUserRankings: UserRank[] = [
  {
    rank: 1,
    name: 'John Doe',
    university: 'MIT',
    studentId: 'STU001',
    uploadedPapers: 45,
    downloadedPapers: 123,
    totalRating: 4.8,
    points: 1250,
  },
  {
    rank: 2,
    name: 'Jane Smith',
    university: 'Stanford',
    studentId: 'STU002',
    uploadedPapers: 38,
    downloadedPapers: 98,
    totalRating: 4.6,
    points: 1180,
  },
  {
    rank: 3,
    name: 'Bob Johnson',
    university: 'Harvard',
    studentId: 'STU003',
    uploadedPapers: 35,
    downloadedPapers: 87,
    totalRating: 4.5,
    points: 1120,
  },
  {
    rank: 4,
    name: 'Alice Brown',
    university: 'Berkeley',
    studentId: 'STU004',
    uploadedPapers: 29,
    downloadedPapers: 76,
    totalRating: 4.3,
    points: 980,
  },
  {
    rank: 5,
    name: 'Charlie Wilson',
    university: 'Caltech',
    studentId: 'STU005',
    uploadedPapers: 25,
    downloadedPapers: 65,
    totalRating: 4.2,
    points: 890,
  },
  {
    rank: 6,
    name: 'David Lee',
    university: 'Princeton',
    studentId: 'STU006',
    uploadedPapers: 22,
    downloadedPapers: 58,
    totalRating: 4.1,
    points: 820,
  },
  {
    rank: 7,
    name: 'Emma Davis',
    university: 'Yale',
    studentId: 'STU007',
    uploadedPapers: 19,
    downloadedPapers: 52,
    totalRating: 4.0,
    points: 750,
  },
  {
    rank: 8,
    name: 'Frank Miller',
    university: 'Columbia',
    studentId: 'STU008',
    uploadedPapers: 16,
    downloadedPapers: 45,
    totalRating: 3.9,
    points: 680,
  },
];

export function UserRankingPage() {
  const [rankings] = useState<UserRank[]>(mockUserRankings);

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
            <p className="text-muted-foreground">Top contributors ranked by uploads, downloads, and ratings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {rankings.slice(0, 3).map((user) => (
              <div
                key={user.rank}
                className={`bg-white rounded-lg border-2 ${getRankBadgeColor(user.rank)} shadow-lg p-6 text-center`}
              >
                <div className="flex justify-center mb-4">
                  {getRankIcon(user.rank)}
                </div>
                <h3 className="text-foreground mb-1">{user.name}</h3>
                <p className="text-muted-foreground mb-2">{user.university}</p>
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg mb-4">
                  <span className="text-2xl">{user.points}</span>
                  <span className="ml-1">points</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-muted-foreground">Uploads</p>
                    <p className="text-foreground flex items-center gap-1">
                      <Upload size={16} className="text-green-600" />
                      {user.uploadedPapers}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Downloads</p>
                    <p className="text-foreground flex items-center gap-1">
                      <Download size={16} className="text-blue-600" />
                      {user.downloadedPapers}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-foreground">{user.totalRating.toFixed(1)}</span>
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
                    <th className="px-6 py-4 text-left text-foreground">Uploads</th>
                    <th className="px-6 py-4 text-left text-foreground">Downloads</th>
                    <th className="px-6 py-4 text-left text-foreground">Rating</th>
                    <th className="px-6 py-4 text-left text-foreground">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((user) => (
                    <tr
                      key={user.rank}
                      className={`border-b border-border hover:bg-accent transition-colors ${
                        user.rank <= 3 ? getRankBadgeColor(user.rank) : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(user.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{user.name}</p>
                          <p className="text-muted-foreground">ID: {user.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.university}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-green-600">
                          <Upload size={16} />
                          <span>{user.uploadedPapers}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Download size={16} />
                          <span>{user.downloadedPapers}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star size={16} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-foreground">{user.totalRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full">
                          {user.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg border border-border shadow-sm p-6">
            <h3 className="text-foreground mb-4">How Points Are Calculated</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Upload size={20} className="text-green-600" />
                  <h4 className="text-foreground">Upload Paper</h4>
                </div>
                <p className="text-muted-foreground">+10 points per paper uploaded</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Download size={20} className="text-blue-600" />
                  <h4 className="text-foreground">Downloads</h4>
                </div>
                <p className="text-muted-foreground">+5 points when someone downloads your upload</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={20} className="text-yellow-600" />
                  <h4 className="text-foreground">Rating</h4>
                </div>
                <p className="text-muted-foreground">Rating multiplier applied to total points</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
