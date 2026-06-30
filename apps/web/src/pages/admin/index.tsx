import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats, useQualityAgreement } from "@/features/admin";
import { useCurrentUser } from "@/features/auth";
import type { AgreementBucket } from "@trend/shared-types";
import { Users, FileText, Lightbulb, BookOpen, Scale } from "lucide-react";

export function AdminHomePage() {
  const { data: me } = useCurrentUser();
  const isAdmin = me?.user?.role === "admin";
  const { data, isLoading } = useAdminStats(isAdmin);
  const { data: agreement } = useQualityAgreement(isAdmin);

  const agreementRows: { label: string; b: AgreementBucket }[] = agreement
    ? [
        { label: "Total", b: agreement },
        { label: "Report", b: agreement.byKind.report },
        { label: "Gap", b: agreement.byKind.gap },
        { label: "Paper", b: agreement.byKind.paper },
      ]
    : [];

  const cards = [
    { label: "Users", value: data?.users.total, icon: Users },
    { label: "Papers", value: data?.papers, icon: BookOpen },
    { label: "AI Reports", value: data?.reports, icon: FileText },
    { label: "Research Gaps", value: data?.gaps, icon: Lightbulb },
  ];

  return (
    <main className="space-y-8">
      <PageHeader title="Admin Overview" description="System statistics and analytics." />
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

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-1 flex items-center gap-2">
          <Scale className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold">AI vs Human Agreement</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Compares AI qualitative evaluation score with average human rating, on items evaluated by both.
          <b> MAE</b> low, <b> "within ±1"</b> high, and <b> correlation</b> close to 1 = AI matches humans.
        </p>
        {!agreement || agreement.sampleSize === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not enough data yet — requires items evaluated by both AI and user ratings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">Type</th>
                  <th className="py-2 pr-4 font-semibold">Samples</th>
                  <th className="py-2 pr-4 font-semibold">MAE</th>
                  <th className="py-2 pr-4 font-semibold">Within ±1</th>
                  <th className="py-2 font-semibold">Correlation</th>
                </tr>
              </thead>
              <tbody>
                {agreementRows.map(({ label, b }) => (
                  <tr key={label} className="border-t">
                    <td className="py-2 pr-4 font-medium">{label}</td>
                    <td className="py-2 pr-4 tabular-nums">{b.sampleSize}</td>
                    <td className="py-2 pr-4 tabular-nums">{b.mae.toFixed(2)}</td>
                    <td className="py-2 pr-4 tabular-nums">{b.withinOnePct}%</td>
                    <td className="py-2 tabular-nums">
                      {b.correlation === null ? "—" : b.correlation.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
