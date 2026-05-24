import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Building2, CheckCircle2, CreditCard, Lock, Mail, Search, ShieldCheck, User } from 'lucide-react';
import { apiRequest, AuthUser, getStoredUser, getToken } from '../lib/api';

export function RegisterPage() {
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    const studentIdError = validateStudentId(formData.studentId);
    if (studentIdError) {
      setError(studentIdError);
      return;
    }

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

      navigate('/login', { state: { registered: true, email: formData.email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-auth bg-fixed">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
          >
            <img src={logo} alt="LiemResearch" className="h-10 w-auto" />
            <span className="text-lg font-medium text-foreground">LiemResearch</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="relative hidden flex-1 text-left md:block"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <span className="block w-full rounded-lg border border-border bg-input-background py-2 pl-10 pr-4 text-muted-foreground">
              Search papers...
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Log in
            </button>
            <button
              type="button"
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground"
            >
              Create account
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl justify-center px-6 py-10">
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

          <div className="rounded-lg border border-border bg-white p-6 shadow-sm md:p-8">
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
              <TextInput
                label="University"
                name="university"
                value={formData.university}
                onChange={handleChange}
                icon={Building2}
                placeholder="FPT University"
                autoComplete="organization"
              />
              <TextInput
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                icon={CreditCard}
                placeholder="SE190001"
                autoComplete="off"
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
                className="w-full rounded-lg bg-primary py-3 text-primary-foreground transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                  Log in here
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
    <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-3 text-sm font-medium text-muted-foreground shadow-sm">
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
          className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
      </div>
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
