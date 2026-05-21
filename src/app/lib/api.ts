export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export type AuthUser = {
  _id: string;
  fullName: string;
  university: string;
  studentId: string;
  email: string;
  role: 'user' | 'admin';
  status?: 'active' | 'banned';
  createdAt?: string;
  updatedAt?: string;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export function getToken() {
  return sessionStorage.getItem('token');
}

export function getStoredUser(): AuthUser | null {
  const rawUser = sessionStorage.getItem('user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    sessionStorage.removeItem('user');
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser) {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth) {
    const token = getToken();
    if (!token) {
      throw new Error('Please log in to continue');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
    }

    throw new Error(data.message || 'Request failed');
  }

  return data as T;
}
