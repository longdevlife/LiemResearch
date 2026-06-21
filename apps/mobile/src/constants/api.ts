/**
 * Centralised list of backend route paths. Shared in spirit with the web app
 * but kept local to mobile so the apps can evolve independently if needed.
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
    overview: "/trends",
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
  },
  gaps: {
    analyze: "/gaps/analyze",
    analyzeStatus: (id: string) => `/gaps/analyze/${id}`,
    list: "/gaps",
    patch: (id: string) => `/gaps/${id}`,
  },
  admin: {
    sync: "/admin/sync",
    syncRuns: "/admin/sync/runs",
  },
} as const;
