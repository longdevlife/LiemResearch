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
  },
  papers: {
    list: "/papers",
    detail: (id: string) => `/papers/${id}`,
  },
  search: {
    semantic: "/search", // GET /search?q= — semantic search (Phase B)
  },
  admin: {
    sync: "/admin/sync",
    syncRuns: "/admin/sync/runs",
  },
} as const;
