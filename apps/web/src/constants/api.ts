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
  home: {
    overview: "/home/overview",
  },
  papers: {
    list: "/papers",
    detail: (id: string) => `/papers/${id}`,
    compare: "/papers/compare",
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
    paperCount: (paperId: string) => `/reports/paper/${paperId}/count`,
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
    read: (id: string) => `/notifications/${id}/read`,
    readAll: "/notifications/read-all",
  },
  analytics: {
    summary: "/analytics/search/summary",
    dashboard: "/analytics/search",
    me: "/analytics/search/me",
  },
  admin: {
    sync: "/admin/sync",
    syncRuns: "/admin/sync/runs",
    embedStatus: "/admin/embed/status",
    triggerEmbed: "/admin/embed",
    users: "/admin/users",
    userRole: (id: string) => `/admin/users/${id}/role`,
    userStatus: (id: string) => `/admin/users/${id}/status`,
    stats: "/admin/stats",
    pipelineStatus: "/admin/pipeline/status",
    evaluationSummary: "/admin/evaluation/summary",
  },
  gaps: {
    analyze: "/gaps/analyze",
    analyzeStatus: (id: string) => `/gaps/analyze/${id}`,
    list: "/gaps",
    patch: (id: string) => `/gaps/${id}`,
    directions: (id: string) => `/gaps/${id}/directions`,
  },
  projects: {
    list: "/projects",
    create: "/projects",
    detail: (id: string) => `/projects/${id}`,
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    addPaper: (id: string) => `/projects/${id}/papers`,
    removePaper: (id: string, paperId: string) => `/projects/${id}/papers/${paperId}`,
    addMember: (id: string) => `/projects/${id}/members`,
    removeMember: (id: string, memberId: string) => `/projects/${id}/members/${memberId}`,
    chat: {
      send: (id: string) => `/projects/${id}/chat`,
      history: (id: string) => `/projects/${id}/chat`,
    },
  }
} as const;
