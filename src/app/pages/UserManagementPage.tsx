import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Search, Eye, Ban, CheckCircle, Filter, Shield, Trash2, X } from 'lucide-react';
import { apiRequest, AuthUser, getStoredUser } from '../lib/api';

type ManagedUser = AuthUser & {
  createdAt?: string;
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : 'N/A';
}

export function UserManagementPage() {
  const currentUser = getStoredUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadUsers() {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterRole !== 'all') params.set('role', filterRole);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest<{ users: ManagedUser[] }>(`/users${query}`, { auth: true });
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUsers();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, filterRole]);

  const stats = {
    total: users.length,
    active: users.filter((user) => user.status === 'active').length,
    banned: users.filter((user) => user.status === 'banned').length,
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'banned') => {
    setError('');
    setMessage('');

    try {
      const data = await apiRequest<{ user: ManagedUser }>(`/users/${userId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status }),
      });

      setUsers(users.map((user) => (user._id === userId ? data.user : user)));
      setSelectedUser((user) => (user?._id === userId ? data.user : user));
      setMessage(`User ${status === 'banned' ? 'banned' : 'unbanned'} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user status');
    }
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
    setError('');
    setMessage('');

    try {
      const data = await apiRequest<{ user: ManagedUser }>(`/users/${userId}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ role }),
      });

      setUsers(users.map((user) => (user._id === userId ? data.user : user)));
      setSelectedUser((user) => (user?._id === userId ? data.user : user));
      setMessage('User role updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user role');
    }
  };

  const deleteUser = async (user: ManagedUser) => {
    const confirmed = window.confirm(`Delete "${user.fullName}"?`);
    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      await apiRequest(`/users/${user._id}`, {
        method: 'DELETE',
        auth: true,
      });

      setUsers(users.filter((item) => item._id !== user._id));
      setSelectedUser(null);
      setShowDetailModal(false);
      setMessage('User deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete user');
    }
  };

  const handleViewDetails = (user: ManagedUser) => {
    setSelectedUser(user);
    setShowDetailModal(true);
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6">
              {message}
            </div>
          )}

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
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background appearance-none"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
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
                    <th className="px-6 py-4 text-left text-foreground">Role</th>
                    <th className="px-6 py-4 text-left text-foreground">Joined</th>
                    <th className="px-6 py-4 text-left text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{user.fullName}</p>
                          <p className="text-muted-foreground">{user.email}</p>
                          <p className="text-muted-foreground">ID: {user.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.university}</td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user._id, e.target.value as 'user' | 'admin')}
                          disabled={user._id === currentUser?._id}
                          className="px-3 py-2 border border-border rounded-lg bg-input-background disabled:opacity-60"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
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
                              onClick={() => updateUserStatus(user._id, 'banned')}
                              disabled={user._id === currentUser?._id}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
                              title="Ban user"
                            >
                              <Ban size={18} className="text-red-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user._id, 'active')}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Unban user"
                            >
                              <CheckCircle size={18} className="text-green-600" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteUser(user)}
                            disabled={user._id === currentUser?._id}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
                            title="Delete user"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isLoading && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            )}

            {!isLoading && users.length === 0 && (
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
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground mb-1">Full Name</p>
                  <p className="text-foreground">{selectedUser.fullName}</p>
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
                  <p className="text-foreground">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Role</p>
                  <p className="text-foreground flex items-center gap-2">
                    <Shield size={16} />
                    {selectedUser.role}
                  </p>
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
                  onClick={() => updateUserStatus(selectedUser._id, 'banned')}
                  disabled={selectedUser._id === currentUser?._id}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Ban User
                </button>
              ) : (
                <button
                  onClick={() => updateUserStatus(selectedUser._id, 'active')}
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
