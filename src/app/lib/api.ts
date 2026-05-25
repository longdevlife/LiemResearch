/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

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
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const rawUser = sessionStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function resolveFileUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;

  const apiUrl = new URL(API_BASE_URL);
  return `${apiUrl.origin}${value}`;
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
