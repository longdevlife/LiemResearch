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
    rankingsTop: "/auth/rankings/top",
    rankingsMe: "/auth/rankings/me",
  },
  papers: {
    list: "/papers",
    create: "/papers",
    detail: (id: string) => `/papers/${id}`,
    references: (id: string) => `/papers/${id}/references`,
    myRequests: "/papers/my-requests",
    uploadPdf: (id: string) => `/papers/${id}/upload-pdf`,
    acceptPdf: (id: string) => `/papers/${id}/accept-pdf`,
    rejectPdf: (id: string) => `/papers/${id}/reject-pdf`,
    cancel: (id: string) => `/papers/${id}/cancel`,
    update: (id: string) => `/papers/${id}`,
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
    delete: (id: string) => `/reports/${id}`,
  },
  bookmarks: {
    list: "/bookmarks",
    create: "/bookmarks",
    delete: (id: string) => `/bookmarks/${id}`,
    check: "/bookmarks/check",
    updateNote: (id: string) => `/bookmarks/${id}`,
  },
  notifications: {
    list: "/notifications",
    registerDeviceToken: "/notifications/device-token",
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: "/notifications/read-all",
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
