import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { apiRequest, AuthUser, saveAuth, getStoredUser, getToken } from '../lib/api';
import { useToast } from '../components/ToastProvider';

export function LoginPage() {
  const { showToast } = useToast();
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Kiểm tra nếu đã đăng nhập, tự động chuyển hướng
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (token && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      showToast('Password is required.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiRequest<{ user: AuthUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      saveAuth(data.token, data.user);

      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard', {
        state: { loginSuccess: true },
        replace: true,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.trim() && !isValidEmail(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
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

          

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="rounded-lg border border-primary px-4 py-2 text-primary transition-colors hover:bg-accent"
            >
              Create account
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <img src={logo} alt="LiemResearch" className="mx-auto mb-6 h-20 w-auto" />
            <h1 className="text-foreground mb-2 text-2xl md:text-3xl font-semibold whitespace-nowrap">Login to LiemResearch</h1>
            <p className="text-muted-foreground">Read papers, request research, and track your contributions.</p>
          </div>

          <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-input-background transition-colors ${
                      emailError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-border focus:ring-primary'
                    }`}
                    placeholder="student@university.edu"
                    required
                  />
                </div>
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
              </div>

              <div>
                <label className="block text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-primary hover:underline"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
