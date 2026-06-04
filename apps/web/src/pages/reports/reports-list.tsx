import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

/**
 * Reports List page.
 *
 * Owner:        Dev 3 (Research & Insights) — Phase C
 *
 * TODO (Phase C):
 *   - "Generate new report" CTA (opens dialog with topic + filter form)
 *   - List of past reports (each: title, topic, generated date, status badge)
 *   - Status filter chips: ready / generating / failed
 *   - Tap row → /reports/:id
 *   - Empty state for first-time users
 */
export function ReportsListPage() {
  return (
    <main className="container py-8">
      <PageHeader
        title="AI Reports"
        description="Analytical reports grounded in retrieved papers."
        actions={<Button>New report</Button>}
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: report list with status badges + new-report dialog
      </div>
    </main>
  );
}
