import { useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Building2, CreditCard, Mail, Lock } from 'lucide-react';
import { apiRequest, AuthUser } from '../lib/api';

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
      const data = await apiRequest<{ user: AuthUser; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      // After successful registration, redirect user to login page
      navigate('/login', { state: { registered: true, email: formData.email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="LiemResearch" className="h-24 w-auto" />
          </div>
          <h1 className="text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Register for LiemResearch</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-foreground mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground mb-2">University</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="University Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground mb-2">Student ID</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="STU123456"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="student@university.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="Create a strong password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="Re-enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>

            {error && (
              <p className="text-red-600 text-center">{error}</p>
            )}
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
