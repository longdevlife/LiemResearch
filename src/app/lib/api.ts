const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Storage sync listeners
let storageListeners: Set<() => void> = new Set();

export function getToken() {
  return localStorage.getItem('token');
}

export function getStoredUser(): AuthUser | null {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Đồng bộ auth giữa các tab trình duyệt
 * Khi một tab thay đổi auth (login/logout), các tab khác sẽ tự động cập nhật
 * @param onAuthChange Callback khi auth thay đổi ở tab khác (type: 'login' | 'logout')
 * @returns Hàm cleanup để dừng lắng nghe
 */
export function setupStorageSync(onAuthChange?: (type: 'login' | 'logout') => void) {
  const handleStorageChange = (event: StorageEvent) => {
    // Lắng nghe sự kiện thay đổi localStorage từ các tab khác
    if (event.key === 'token' || event.key === 'user') {
      if (event.newValue === null) {
        // Token hoặc user bị xóa (logout ở tab khác)
        onAuthChange?.('logout');
      } else {
        // Token hoặc user được cập nhật (login ở tab khác)
        onAuthChange?.('login');
      }
    }
  };

  // Thêm listener
  window.addEventListener('storage', handleStorageChange);
  storageListeners.add(handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    storageListeners.delete(handleStorageChange);
  };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data as T;
}
