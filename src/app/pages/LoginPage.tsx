import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Mail, Search } from 'lucide-react';
import { apiRequest, AuthUser, saveAuth } from '../lib/api';

export function LoginPage() {
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
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
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground"
            >
              Log in
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
            <h1 className="text-foreground mb-2">Log in to LiemResearch</h1>
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
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              {error && (
                <p className="text-red-600 text-center">{error}</p>
              )}
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
