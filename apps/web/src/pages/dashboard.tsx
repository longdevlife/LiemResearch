import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { api } from "@/services/api-client";
import { API_ROUTES } from "@/constants/api";
import { useCurrentUser } from "@/features/auth";
import { PageHeader } from "@/components/page-header";
import type { TopQuery, VolumeByDay } from "@trend/shared-types";

function useDashboard(days: number, enabled: boolean) {
  return useQuery({
    queryKey: ["analytics", "dashboard", days],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.analytics.dashboard, { params: { days } });
      return res.data.data as { topQueries: TopQuery[]; volumeByDay: VolumeByDay[]; days: number };
    },
    staleTime: 60_000,
    enabled,
  });
}

function useMySearchHistory() {
  return useQuery({
    queryKey: ["analytics", "me"],
    queryFn: async () => {
      const res = await api.get(API_ROUTES.analytics.me);
      return res.data.data as Array<{ query: string; mode: string; resultCount: number; createdAt: string }>;
    },
  });
}

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const isAdmin = user?.user?.role === "admin";
  const { data: dash, isLoading: isDashLoading } = useDashboard(7, isAdmin);
  const { data: history } = useMySearchHistory();

  return (
    <main className="container py-8 space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${user?.user?.email ?? "…"}`}
      />

      {isAdmin ? (
        <>
          {isDashLoading ? (
            <p className="text-muted-foreground">Loading analytics…</p>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold mb-3">Search volume — last 7 days</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dash?.volumeByDay ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">Top 10 queries — last 7 days</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dash?.topQueries ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="query" type="category" width={180} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            </>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Dashboard analytics require admin access.</p>
      )}

      {history && history.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">My recent searches</h2>
          <div className="rounded-md border divide-y text-sm">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2">
                <span className="truncate max-w-xs">{h.query}</span>
                <span className="text-muted-foreground ml-4 shrink-0">
                  {h.resultCount} results · {h.mode}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
