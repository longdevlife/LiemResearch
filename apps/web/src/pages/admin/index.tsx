import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/features/admin";
import { useCurrentUser } from "@/features/auth";
import { Users, FileText, Lightbulb, BookOpen } from "lucide-react";

export function AdminHomePage() {
  const { data: me } = useCurrentUser();
  const isAdmin = me?.user?.role === "admin";
  const { data, isLoading } = useAdminStats(isAdmin);

  const cards = [
    { label: "Users", value: data?.users.total, icon: Users },
    { label: "Papers", value: data?.papers, icon: BookOpen },
    { label: "AI Reports", value: data?.reports, icon: FileText },
    { label: "Research Gaps", value: data?.gaps, icon: Lightbulb },
  ];

  return (
    <main className="space-y-8">
      <PageHeader title="Admin overview" description="System totals at a glance." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-bold tabular-nums">
              {isLoading || value === undefined ? <Skeleton className="h-8 w-16" /> : value}
            </div>
          </div>
        ))}
      </div>
      {data && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Users by role</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(data.users.byRole).map(([role, count]) => (
              <span key={role} className="rounded-md bg-muted px-3 py-1">
                {role}: <strong className="tabular-nums">{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
