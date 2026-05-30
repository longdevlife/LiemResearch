import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth";

/**
 * Admin Sync Management page.
 *
 * Owner:        Lead (Backend / Admin)
 * Designed in:  docs/STITCH_PROMPTS.md → Web 7
 * Spec:         docs/superpowers/specs/2026-05-25-phase-a-design.md
 *
 * TODO:
 *   - Gate by useCurrentUser().data.user.role === "admin" — show Access Denied otherwise
 *   - Tabs: Active Configs / Run History / API Providers / Audit Logs
 *   - Active Configs tab: table of api_sync_configs with enable/disable toggle
 *   - "Trigger new sync" button → dialog with searchText, year range, max pages
 *   - System status sidebar: worker running, queue depth, today's stats
 *   - Uses POST /api/v1/admin/sync (built in Phase A Track A)
 */
export function AdminSyncPage() {
  const { data } = useCurrentUser();
  const isAdmin = data?.user?.role === "admin";

  if (!isAdmin) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">
          Only admins can view this page.
        </p>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <PageHeader
        title="Sync management"
        description="Trigger and monitor academic API synchronisation."
        actions={<Button>Trigger new sync</Button>}
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: tabs (Active Configs / Run History / API Providers / Audit Logs)
        + system status sidebar
      </div>
    </main>
  );
}
