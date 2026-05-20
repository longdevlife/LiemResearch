import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { User, Mail, Building2, CreditCard, Trophy, Upload, Download, Star, Edit } from 'lucide-react';

export function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: 'John Doe',
    email: 'john.doe@mit.edu',
    university: 'MIT',
    studentId: 'STU001',
    memberSince: '2024-01-15',
    bio: 'Computer Science student interested in Machine Learning and AI research.',
  });

  const [editForm, setEditForm] = useState(profile);

  const stats = {
    uploadedPapers: 45,
    downloadedPapers: 123,
    rating: 4.8,
    points: 1250,
    rank: 1,
  };

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="user" />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information and view statistics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Uploads</span>
                <Upload size={20} className="text-green-600" />
              </div>
              <h3 className="text-foreground">{stats.uploadedPapers}</h3>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Downloads</span>
                <Download size={20} className="text-blue-600" />
              </div>
              <h3 className="text-foreground">{stats.downloadedPapers}</h3>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Rating</span>
                <Star size={20} className="text-yellow-500" />
              </div>
              <h3 className="text-foreground">{stats.rating.toFixed(1)} / 5.0</h3>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Your Rank</p>
                <h2 className="mb-2">#{stats.rank}</h2>
                <p className="text-blue-100">Total Points: {stats.points}</p>
              </div>
              <Trophy size={64} className="text-yellow-300" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground">Personal Information</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    Full Name
                  </div>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={18} />
                    Email
                  </div>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} />
                    University
                  </div>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.university}
                    onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.university}</p>
                )}
              </div>

              <div>
                <label className="block text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} />
                    Student ID
                  </div>
                </label>
                <p className="text-muted-foreground">{profile.studentId}</p>
                <p className="text-muted-foreground mt-1">Member since {profile.memberSince}</p>
              </div>

              <div>
                <label className="block text-foreground mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
