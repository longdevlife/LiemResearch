/**
 * Centralised list of backend route paths. Use these everywhere instead of
 * string literals so renames stay safe and grep-able.
 */
export const API_ROUTES = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  papers: {
    list: "/papers",
    detail: (id: string) => `/papers/${id}`,
  },
  search: {
    keyword: "/search",
    semantic: "/search/semantic",
  },
  trends: {
    topic: (topic: string) => `/trends/${encodeURIComponent(topic)}`,
  },
  reports: {
    list: "/reports",
    detail: (id: string) => `/reports/${id}`,
    generate: "/reports/generate",
  },
  admin: {
    sync: "/admin/sync",
    syncRuns: "/admin/sync/runs",
  },
} as const;
