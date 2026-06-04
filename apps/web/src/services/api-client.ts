import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";

const baseURL = import.meta.env.VITE_API_BASE ?? "/api/v1";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const refreshToken = useAuthStore.getState().tokens?.refreshToken;

    if (error.response?.status === 401 && refreshToken && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken(refreshToken).finally(() => {
        refreshPromise = null;
      });
      const newAccess = await refreshPromise;
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      useAuthStore.getState().clear();
    }

    return Promise.reject(error);
  },
);

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const tokens = res.data?.data;
    if (tokens) {
      useAuthStore.getState().setTokens(tokens);
      return tokens.accessToken as string;
    }
  } catch {
    // fall through
  }
  return null;
}
