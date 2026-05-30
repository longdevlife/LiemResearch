import { PageHeader } from "@/components/page-header";

/**
 * Notifications page — system + follow updates + project invites.
 *
 * Owner:        Dev 2 (Personalization) — Phase D
 *
 * TODO (Phase D):
 *   - Filter: All / Unread / Mentions / Project invites
 *   - Grouped by time: Today / Yesterday / This week / Earlier
 *   - Each row: icon + title + 1-line body + timestamp + mark-as-read action
 *   - Mark all as read button
 *   - Empty state
 */
export function NotificationsPage() {
  return (
    <main className="container py-8">
      <PageHeader
        title="Notifications"
        description="Recent updates on your followed topics and projects."
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: filter tabs + grouped notification list + bulk actions
      </div>
    </main>
  );
}
