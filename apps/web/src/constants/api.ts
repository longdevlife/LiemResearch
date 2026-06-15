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
    changePassword: "/auth/change-password",
  },
  papers: {
    list: "/papers",
    detail: (id: string) => `/papers/${id}`,
  },
  search: {
    semantic: "/search", 
  },
  trends: {
    topic: (topic: string) => `/trends/${encodeURIComponent(topic)}`,
  },
  reports: {
    list: "/reports",
    detail: (id: string) => `/reports/${id}`,
    create: "/reports",
  },
  bookmarks: {
    list: "/bookmarks",
    create: "/bookmarks",
    delete: (id: string) => `/bookmarks/${id}`,
    check: "/bookmarks/check",
    updateNote: (id: string) => `/bookmarks/${id}`,
  },
  analytics: {
    summary: "/analytics/search/summary",
    dashboard: "/analytics/search",
    me: "/analytics/search/me",
  },
  admin: {
    sync: "/admin/sync",
    syncRuns: "/admin/sync/runs",
  },
} as const;
