import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Search, Eye, Ban, CheckCircle, Filter } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  studentId: string;
  status: 'active' | 'banned';
  uploadedPapers: number;
  downloadedPapers: number;
  rating: number;
  joinDate: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@mit.edu',
    university: 'MIT',
    studentId: 'STU001',
    status: 'active',
    uploadedPapers: 45,
    downloadedPapers: 123,
    rating: 4.8,
    joinDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@stanford.edu',
    university: 'Stanford',
    studentId: 'STU002',
    status: 'active',
    uploadedPapers: 38,
    downloadedPapers: 98,
    rating: 4.6,
    joinDate: '2024-02-20',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@harvard.edu',
    university: 'Harvard',
    studentId: 'STU003',
    status: 'banned',
    uploadedPapers: 15,
    downloadedPapers: 45,
    rating: 3.2,
    joinDate: '2024-03-10',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice.brown@berkeley.edu',
    university: 'Berkeley',
    studentId: 'STU004',
    status: 'active',
    uploadedPapers: 29,
    downloadedPapers: 76,
    rating: 4.3,
    joinDate: '2024-01-25',
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: 'charlie.wilson@caltech.edu',
    university: 'Caltech',
    studentId: 'STU005',
    status: 'active',
    uploadedPapers: 25,
    downloadedPapers: 65,
    rating: 4.2,
    joinDate: '2024-02-05',
  },
];

export function UserManagementPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.studentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleBanUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && window.confirm(`Are you sure you want to ban ${user.name}?`)) {
      setUsers(users.map(u =>
        u.id === userId ? { ...u, status: 'banned' as const } : u
      ));
    }
  };

  const handleUnbanUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && window.confirm(`Are you sure you want to unban ${user.name}?`)) {
      setUsers(users.map(u =>
        u.id === userId ? { ...u, status: 'active' as const } : u
      ));
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage users and their access to the system</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Total Users</p>
                  <h3 className="text-foreground">{stats.total}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Eye size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Active Users</p>
                  <h3 className="text-foreground">{stats.active}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Banned Users</p>
                  <h3 className="text-foreground">{stats.banned}</h3>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <Ban size={24} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, university, or student ID..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-foreground">User</th>
                    <th className="px-6 py-4 text-left text-foreground">University</th>
                    <th className="px-6 py-4 text-left text-foreground">Uploads</th>
                    <th className="px-6 py-4 text-left text-foreground">Downloads</th>
                    <th className="px-6 py-4 text-left text-foreground">Rating</th>
                    <th className="px-6 py-4 text-left text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{user.name}</p>
                          <p className="text-muted-foreground">{user.email}</p>
                          <p className="text-muted-foreground">ID: {user.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.university}</td>
                      <td className="px-6 py-4 text-foreground">{user.uploadedPapers}</td>
                      <td className="px-6 py-4 text-foreground">{user.downloadedPapers}</td>
                      <td className="px-6 py-4 text-foreground">{user.rating.toFixed(1)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full border ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {user.status === 'active' ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={18} className="text-blue-600" />
                          </button>

                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleBanUser(user.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Ban user"
                            >
                              <Ban size={18} className="text-red-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnbanUser(user.id)}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Unban user"
                            >
                              <CheckCircle size={18} className="text-green-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No users found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-foreground">User Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Eye size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground mb-1">Full Name</p>
                  <p className="text-foreground">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Student ID</p>
                  <p className="text-foreground">{selectedUser.studentId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">University</p>
                  <p className="text-foreground">{selectedUser.university}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Join Date</p>
                  <p className="text-foreground">{selectedUser.joinDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full border ${
                    selectedUser.status === 'active'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {selectedUser.status === 'active' ? 'Active' : 'Banned'}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-foreground mb-4">Activity Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-muted-foreground mb-1">Uploaded Papers</p>
                    <p className="text-foreground text-2xl">{selectedUser.uploadedPapers}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-muted-foreground mb-1">Downloaded Papers</p>
                    <p className="text-foreground text-2xl">{selectedUser.downloadedPapers}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-muted-foreground mb-1">Rating</p>
                    <p className="text-foreground text-2xl">{selectedUser.rating.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 p-6 border-t border-border">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Close
              </button>
              {selectedUser.status === 'active' ? (
                <button
                  onClick={() => {
                    handleBanUser(selectedUser.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ban User
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleUnbanUser(selectedUser.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Unban User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
