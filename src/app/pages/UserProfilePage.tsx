import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import { User, Mail, Building2, CreditCard, Trophy, FileText, Star, Edit, Upload } from 'lucide-react';
import { apiRequest, AuthUser, clearAuth, getStoredUser, getToken, saveAuth } from '../lib/api';

type ProfileForm = {
  fullName: string;
  email: string;
  university: string;
  studentId: string;
  memberSince: string;
};

type RankingStats = {
  rank: number;
  uploadedPapers: number;
  uploadedPdfs: number;
  ratingsGiven: number;
  points: number;
};

function mapUserToProfile(user: AuthUser): ProfileForm {
  return {
    fullName: user.fullName,
    email: user.email,
    university: user.university,
    studentId: user.studentId,
    memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
  };
}

export function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const storedUser = getStoredUser();
  const initialProfile = storedUser
    ? mapUserToProfile(storedUser)
    : { fullName: '', email: '', university: '', studentId: '', memberSince: '' };
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [editForm, setEditForm] = useState<ProfileForm>(initialProfile);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const [profileData, rankingData] = await Promise.all([
          apiRequest<{ user: AuthUser }>('/auth/me', { auth: true }),
          apiRequest<{ ranking: RankingStats }>('/rankings/me', { auth: true }).catch(() => ({ ranking: null })),
        ]);
        const nextProfile = mapUserToProfile(profileData.user);

        if (isMounted) {
          setProfile(nextProfile);
          setEditForm(nextProfile);
          setRankingStats(rankingData.ranking);
          const token = getToken();
          if (token) saveAuth(token, profileData.user);
          setError('');
        }
      } catch (err) {
        clearAuth();
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load profile');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setError('');
    setMessage('');

    const fullNameError = validateFullName(editForm.fullName);
    if (fullNameError) {
      setError(fullNameError);
      return;
    }

    const universityError = validateUniversity(editForm.university);
    if (universityError) {
      setError(universityError);
      return;
    }

    const studentIdError = validateStudentId(editForm.studentId);
    if (studentIdError) {
      setError(studentIdError);
      return;
    }

    setIsSaving(true);

    try {
      const data = await apiRequest<{ user: AuthUser }>('/auth/me', {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          fullName: editForm.fullName,
          university: editForm.university,
          studentId: editForm.studentId,
        }),
      });
      const token = getToken();
      const nextProfile = mapUserToProfile(data.user);

      if (token) saveAuth(token, data.user);

      setProfile(nextProfile);
      setEditForm(nextProfile);
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="user" />

      <div className="flex-1 p-8">
        <AppHeader role="user" />
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information and view statistics</p>
          </div>

          {isLoading && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-6 mb-8">
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-8">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Valid Papers</span>
                <FileText size={20} className="text-green-600" />
              </div>
              <h3 className="text-foreground">{rankingStats?.uploadedPapers ?? 0}</h3>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Valid PDFs</span>
                <Upload size={20} className="text-blue-600" />
              </div>
              <h3 className="text-foreground">{rankingStats?.uploadedPdfs ?? 0}</h3>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Ratings</span>
                <Star size={20} className="text-yellow-500" />
              </div>
              <h3 className="text-foreground">{rankingStats?.ratingsGiven ?? 0}</h3>
            </div>

            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Points</span>
                <Trophy size={20} className="text-blue-600" />
              </div>
              <h3 className="text-foreground">{rankingStats?.points ?? 0}</h3>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Your Rank</p>
                <h2 className="mb-2">{rankingStats ? `#${rankingStats.rank}` : 'N/A'}</h2>
                <p className="text-blue-100">Total Points: {rankingStats?.points ?? 0}</p>
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
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
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
                    disabled
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function validateUniversity(value: string) {
  const university = value.trim().replace(/\s+/g, ' ');
  const words = university.split(' ').filter(Boolean);
  const hasLetters = /[a-z]/i.test(university);
  const hasUniversityWord = /\b(university|college|institute|academy|school|đại học|dai hoc|trường|truong|fpt|hutech|rmit)\b/i.test(university);

  if (university.length < 5 || !hasLetters) {
    return 'Please enter a valid university name.';
  }

  if (!/^[a-z0-9\s.'&\-À-ỹ]+$/i.test(university)) {
    return 'University name contains invalid characters.';
  }

  if (words.length < 2 && !hasUniversityWord) {
    return 'Please enter the full university name.';
  }

  return '';
}

function validateFullName(value: string) {
  const fullName = value.trim().replace(/\s+/g, ' ');
  const words = fullName.split(' ').filter(Boolean);

  if (fullName.length < 4 || words.length < 2 || !/[a-zÀ-ỹ]/i.test(fullName)) {
    return 'Please enter your full name.';
  }

  if (!/^[a-z\s.'-À-ỹ]+$/i.test(fullName)) {
    return 'Full name contains invalid characters.';
  }

  return '';
}

function validateStudentId(value: string) {
  const studentId = value.trim();

  if (studentId.length < 4 || studentId.length > 30) {
    return 'Student ID must be between 4 and 30 characters.';
  }

  if (!/^[a-z0-9._-]+$/i.test(studentId)) {
    return 'Student ID contains invalid characters.';
  }

  return '';
}
