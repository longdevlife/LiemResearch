import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import { LoadingSkeleton } from '../components/LoadingSpinner';
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  Star,
  Trophy,
  Upload,
  User,
} from 'lucide-react';
import { apiRequest, AuthUser, clearAuth, getStoredUser, getToken, saveAuth } from '../lib/api';
import { formatDisplayDate } from '../lib/date';
import { validateStudentId } from '../lib/validation';

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

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PaperRequest = {
  _id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'downloaded' | 'not-downloaded';
  pdfPath?: string;
  createdAt: string;
  updatedAt?: string;
  uploadedAt?: string;
};

type ProfileTab = 'overview' | 'activity' | 'settings';

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  tone: 'blue' | 'green' | 'amber' | 'red';
};

function mapUserToProfile(user: AuthUser): ProfileForm {
  return {
    fullName: user.fullName,
    email: user.email,
    university: user.university,
    studentId: user.studentId,
    memberSince: user.createdAt ? formatDisplayDate(user.createdAt) : '',
  };
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(value?: string) {
  if (!value) return '';
  return formatDisplayDate(value);
}

function getStatusLabel(status: PaperRequest['status']) {
  const labels = {
    pending: 'Pending review',
    approved: 'No PDF yet',
    rejected: 'Rejected',
    downloaded: 'PDF available',
    'not-downloaded': 'No PDF yet',
  };

  return labels[status];
}

function buildRecentActivity(papers: PaperRequest[]): ActivityItem[] {
  const items = papers.flatMap((paper) => {
    const activities: ActivityItem[] = [
      {
        id: `${paper._id}-requested`,
        title: 'Requested a paper',
        description: paper.title,
        date: paper.createdAt,
        tone: 'blue',
      },
    ];

    if (paper.pdfPath && paper.uploadedAt) {
      activities.push({
        id: `${paper._id}-pdf`,
        title: 'Uploaded a PDF',
        description: paper.title,
        date: paper.uploadedAt,
        tone: 'green',
      });
    }

    if (paper.status === 'rejected') {
      activities.push({
        id: `${paper._id}-rejected`,
        title: 'Paper was rejected',
        description: paper.title,
        date: paper.updatedAt || paper.createdAt,
        tone: 'red',
      });
    } else if (paper.status === 'downloaded' || paper.status === 'not-downloaded' || paper.status === 'approved') {
      activities.push({
        id: `${paper._id}-approved`,
        title: 'Paper was approved',
        description: paper.title,
        date: paper.updatedAt || paper.createdAt,
        tone: paper.status === 'downloaded' ? 'green' : 'amber',
      });
    }

    return activities;
  });

  return items
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 8);
}

export function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const storedUser = getStoredUser();
  const initialProfile = storedUser
    ? mapUserToProfile(storedUser)
    : { fullName: '', email: '', university: '', studentId: '', memberSince: '' };
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [editForm, setEditForm] = useState<ProfileForm>(initialProfile);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);
  const [myPapers, setMyPapers] = useState<PaperRequest[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const [profileData, rankingData, paperData] = await Promise.all([
          apiRequest<{ user: AuthUser }>('/auth/me', { auth: true }),
          apiRequest<{ ranking: RankingStats }>('/rankings/me', { auth: true }).catch(() => ({ ranking: null })),
          apiRequest<{ papers: PaperRequest[] }>('/papers/my-requests', { auth: true }).catch(() => ({ papers: [] })),
        ]);
        const nextProfile = mapUserToProfile(profileData.user);

        if (isMounted) {
          setProfile(nextProfile);
          setEditForm(nextProfile);
          setRankingStats(rankingData.ranking);
          setMyPapers(paperData.papers);
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

  const activityItems = useMemo(() => buildRecentActivity(myPapers), [myPapers]);
  const approvedPapers = myPapers.filter((paper) =>
    ['approved', 'downloaded', 'not-downloaded'].includes(paper.status)
  ).length;
  const pdfReadyPapers = myPapers.filter((paper) => Boolean(paper.pdfPath)).length;
  const initials = getInitials(profile.fullName) || 'U';

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

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const data = await apiRequest<{ message: string; token: string }>('/auth/change-password', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(passwordForm),
      });
      const currentUser = getStoredUser();

      if (currentUser) saveAuth(data.token, currentUser);

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-achievement bg-fixed">
      <Sidebar role="user" />

      <div className="flex-1">
        <AppHeader role="user" />
        <div className="p-8">
          <div className="mx-auto max-w-6xl">
          {isLoading && (
            <div className="mb-6">
              <LoadingSkeleton variant="profile" />
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )}

          {!isLoading && (
            <>
              <section className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div className="h-28 bg-blue-600" />
            <div className="px-8 pb-8">
              <div className="-mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex h-28 w-28 items-center justify-center rounded-lg border-4 border-white bg-foreground text-4xl font-semibold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="pb-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                        {rankingStats ? `Rank #${rankingStats.rank}` : 'Rank N/A'}
                      </span>
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                        {rankingStats?.points ?? 0} points
                      </span>
                    </div>
                    <h1 className="text-3xl font-semibold text-foreground">{profile.fullName || 'My Profile'}</h1>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Building2 size={16} />
                        {profile.university || 'No university'}
                      </span>
                      <span className="flex items-center gap-2">
                        <CreditCard size={16} />
                        {profile.studentId || 'No student ID'}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar size={16} />
                        Joined {profile.memberSince || 'recently'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-primary-foreground transition-colors hover:bg-blue-600"
                >
                  <Edit size={18} />
                  Edit Profile
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
                <ProfileMetric label="Papers" value={myPapers.length} icon={FileText} />
                <ProfileMetric label="Approved" value={approvedPapers} icon={CheckCircle2} />
                <ProfileMetric label="PDFs" value={pdfReadyPapers} icon={Upload} />
                <ProfileMetric label="Ratings" value={rankingStats?.ratingsGiven ?? 0} icon={Star} />
                <ProfileMetric label="Points" value={rankingStats?.points ?? 0} icon={Trophy} />
              </div>
            </div>
              </section>

              <div className="mt-6 rounded-lg border border-border bg-white shadow-sm">
            <div className="flex border-b border-border px-4">
              <ProfileTabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                Overview
              </ProfileTabButton>
              <ProfileTabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
                Activity
              </ProfileTabButton>
              <ProfileTabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
                Settings
              </ProfileTabButton>
            </div>

            <div className="p-6 md:p-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <h3 className="mb-4 text-foreground">Research Contribution</h3>
                    <div className="space-y-4">
                      <ContributionRow
                        label="Valid paper requests"
                        value={rankingStats?.uploadedPapers ?? approvedPapers}
                        detail="Papers approved by admin"
                        icon={FileText}
                      />
                      <ContributionRow
                        label="PDF contributions"
                        value={rankingStats?.uploadedPdfs ?? pdfReadyPapers}
                        detail="Useful files uploaded for the library"
                        icon={Upload}
                      />
                      <ContributionRow
                        label="Ratings given"
                        value={rankingStats?.ratingsGiven ?? 0}
                        detail="Feedback shared with the community"
                        icon={Star}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-foreground">Badges</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <BadgeItem active={myPapers.length > 0} icon={FileText} title="First Paper" />
                      <BadgeItem active={pdfReadyPapers > 0} icon={Upload} title="PDF Contributor" />
                      <BadgeItem active={(rankingStats?.ratingsGiven ?? 0) > 0} icon={Star} title="Reviewer" />
                      <BadgeItem active={(rankingStats?.points ?? 0) >= 100} icon={Award} title="Rising Scholar" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-foreground">Recent Activity</h3>
                      <p className="mt-1 text-muted-foreground">Latest movement from your research requests.</p>
                    </div>
                  </div>

                  {activityItems.length > 0 ? (
                    <div className="space-y-3">
                      {activityItems.map((item) => (
                        <ActivityRow key={item.id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                      No activity yet. Your requests and PDF uploads will appear here.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <section>
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <h3 className="text-foreground">Personal Information</h3>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-blue-600"
                        >
                          <Edit size={18} />
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={handleCancel}
                            className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-accent"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-5">
                      <ProfileField
                        icon={User}
                        label="Full Name"
                        value={profile.fullName}
                        isEditing={isEditing}
                        inputValue={editForm.fullName}
                        onChange={(value) => setEditForm({ ...editForm, fullName: value })}
                      />
                      <ProfileField icon={Mail} label="Email" value={profile.email} disabled inputValue={editForm.email} isEditing={isEditing} />
                      <ProfileField
                        icon={Building2}
                        label="University"
                        value={profile.university}
                        isEditing={isEditing}
                        inputValue={editForm.university}
                        onChange={(value) => setEditForm({ ...editForm, university: value })}
                      />
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-foreground">
                          <CreditCard size={18} />
                          Student ID
                        </label>
                        <p className="text-muted-foreground">{profile.studentId}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="mb-6 flex items-center gap-2">
                      <Lock size={20} className="text-primary" />
                      <h3 className="text-foreground">Change Password</h3>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-5">
                      <PasswordInput
                        label="Current Password"
                        value={passwordForm.currentPassword}
                        autoComplete="current-password"
                        placeholder="Enter your current password"
                        onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
                      />
                      <PasswordInput
                        label="New Password"
                        value={passwordForm.newPassword}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
                      />
                      <PasswordInput
                        label="Confirm New Password"
                        value={passwordForm.confirmPassword}
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
                      />

                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full rounded-lg bg-primary px-5 py-3 text-primary-foreground transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </section>
                </div>
              )}
            </div>
          </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-sm">{label}</span>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProfileTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-4 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function ContributionRow({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof FileText;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function BadgeItem({
  active,
  icon: Icon,
  title,
}: {
  active: boolean;
  icon: typeof FileText;
  title: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 ${
        active ? 'border-green-200 bg-green-50 text-green-800' : 'border-border bg-muted text-muted-foreground'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{title}</span>
      {active && <ShieldCheck size={18} className="ml-auto" />}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="flex gap-4 rounded-lg border border-border p-4">
      <div className={`mt-1 h-3 w-3 shrink-0 rounded-full border ${tones[item.tone]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-foreground">{item.title}</p>
          <span className="text-sm text-muted-foreground">{formatDate(item.date)}</span>
        </div>
        <p className="mt-1 truncate text-muted-foreground">{item.description}</p>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  isEditing,
  inputValue,
  onChange,
  disabled,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  isEditing: boolean;
  inputValue: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-foreground">
        <Icon size={18} />
        {label}
      </label>
      {isEditing ? (
        <input
          type={label === 'Email' ? 'email' : 'text'}
          value={inputValue}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:text-muted-foreground"
        />
      ) : (
        <p className="text-muted-foreground">{value}</p>
      )}
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-foreground">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function validateUniversity(value: string) {
  const university = value.trim().replace(/\s+/g, ' ');
  const words = university.split(' ').filter(Boolean);
  const hasLetters = /\p{L}/u.test(university);
  const hasUniversityWord = /\b(university|college|institute|academy|school|dai hoc|truong|fpt|hutech|rmit)\b|đại học|trường/i.test(university);

  if (university.length < 5 || !hasLetters) {
    return 'Please enter a valid university name.';
  }

  if (!/^[\p{L}0-9\s.'&-]+$/u.test(university)) {
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

  if (fullName.length < 4 || words.length < 2 || !/\p{L}/u.test(fullName)) {
    return 'Please enter your full name.';
  }

  if (!/^[\p{L}\s.'-]+$/u.test(fullName)) {
    return 'Full name contains invalid characters.';
  }

  return '';
}

