import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Building2, CheckCircle2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { apiRequest, AuthUser, getStoredUser, getToken } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { UNIVERSITY_LIST_VN } from '../lib/universities';

export function RegisterPage() {
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUniversityOpen, setIsUniversityOpen] = useState(false);

  const filteredUniversities = UNIVERSITY_LIST_VN.filter((university) =>
    university.toLowerCase().includes(formData.university.trim().toLowerCase())
  ).slice(0, 8);

  // Kiểm tra nếu đã đăng nhập, tự động chuyển hướng
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (token && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleUniversitySelect = (university: string) => {
    setFormData({
      ...formData,
      university,
    });
    setIsUniversityOpen(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullNameError = validateFullName(formData.fullName);
    if (fullNameError) {
      setError(fullNameError);
      return;
    }

    const universityError = validateUniversity(formData.university);
    if (universityError) {
      setError(universityError);
      return;
    }

    // studentId removed from registration
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest<{ user: AuthUser; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      showToast('Account created successfully. Please login.', 'success');

      navigate('/login', { state: { registered: true, email: formData.email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-feed bg-fixed text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3.5 lg:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          >
            <img src={logo} alt="LiemResearch" className="h-9 w-auto lg:h-10" />
            <span className="text-base font-semibold tracking-tight text-foreground lg:text-lg">LiemResearch</span>
          </button>

          

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Login
            </button>
            <button
              type="button"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Create account
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl justify-center px-5 py-10 lg:px-6">
        <section className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <img src={logo} alt="LiemResearch" className="mx-auto mb-6 h-20 w-auto" />
            <h1 className="mb-2 text-foreground">Create account</h1>
            <p className="text-muted-foreground">Join LiemResearch to request papers and track your contributions.</p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <BenefitPill icon={BookOpen} label="Request papers" />
            <BenefitPill icon={ShieldCheck} label="Earn points" />
            <BenefitPill icon={CheckCircle2} label="Track profile" />
          </div>

          <div className="rounded-[2rem] border border-border/80 bg-white/75 p-6 shadow-[0_20px_60px_rgba(31,29,26,0.08)] backdrop-blur md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <TextInput
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                icon={User}
                placeholder="Nguyen Van A"
                autoComplete="name"
              />
              <UniversitySearchInput
                label="University"
                value={formData.university}
                onChange={(value) => {
                  setFormData({ ...formData, university: value });
                  setIsUniversityOpen(true);
                  setError('');
                }}
                onSelect={handleUniversitySelect}
                onFocus={() => setIsUniversityOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setIsUniversityOpen(false), 150);
                }}
                isOpen={isUniversityOpen}
                suggestions={filteredUniversities}
                icon={Building2}
                placeholder="Search and select your university"
              />
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                placeholder="student@university.edu"
                autoComplete="email"
              />
              <TextInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <TextInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={Lock}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-primary py-3 text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function BenefitPill({
  icon: Icon,
  label,
}: {
  icon: typeof BookOpen;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-white/75 px-3 py-3 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
      <Icon size={16} className="text-primary" />
      {label}
    </div>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  icon: Icon,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: typeof User;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-border bg-[color:var(--input-background)] py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
      </div>
    </div>
  );
}

function UniversitySearchInput({
  label,
  value,
  onChange,
  onSelect,
  onFocus,
  onBlur,
  isOpen,
  suggestions,
  icon: Icon,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isOpen: boolean;
  suggestions: string[];
  icon: typeof User;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <label className="mb-2 block text-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
          autoComplete="off"
          required
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-border/80 bg-white/95 shadow-[0_20px_60px_rgba(31,29,26,0.12)] backdrop-blur">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-accent"
            >
              <Building2 size={16} className="text-muted-foreground" />
              <span className="truncate">{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function validateUniversity(value: string) {
  const university = value.trim().replace(/\s+/g, ' ');
  if (!university) {
    return 'Please select your university.';
  }

  const isMatch = UNIVERSITY_LIST_VN.some(
    (item) => item.trim().replace(/\s+/g, ' ').toLowerCase() === university.toLowerCase()
  );

  if (!isMatch) {
    return 'Please choose a university from the list.';
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
