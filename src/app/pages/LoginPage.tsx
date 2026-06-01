import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { apiRequest, AuthUser, saveAuth, getStoredUser, getToken } from '../lib/api';
import { useToast } from '../components/ToastProvider';

export function LoginPage() {
  const { showToast } = useToast();
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    if (location.state?.registered) {
      showToast('Account created successfully. Please login.', 'success');
      if (location.state.email) setEmail(location.state.email as string);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, showToast]);

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
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Create account
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl justify-center px-5 py-12 lg:px-6">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <img src={logo} alt="LiemResearch" className="mx-auto mb-6 h-20 w-auto" />
            <h1 className="text-foreground mb-2 text-2xl md:text-3xl font-semibold whitespace-nowrap">Login to LiemResearch</h1>
            <p className="text-muted-foreground">Read papers, request research, and track your contributions.</p>
          </div>

          <div className="rounded-[2rem] border border-border/80 bg-white/75 p-8 shadow-[0_20px_60px_rgba(31,29,26,0.08)] backdrop-blur">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full rounded-lg border bg-[color:var(--input-background)] py-3 pl-10 pr-4 transition-colors focus:outline-none focus:ring-2 ${
                      emailError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-border focus:ring-ring'
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
                    className="w-full rounded-lg border border-border bg-[color:var(--input-background)] py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-full bg-primary py-3 text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
