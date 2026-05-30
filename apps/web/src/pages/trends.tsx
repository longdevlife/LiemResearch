import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

/**
 * Trend Dashboard page.
 *
 * Owner:        Dev 1 (Discovery)
 * Designed in:  docs/STITCH_PROMPTS.md → Web 5
 *
 * TODO:
 *   - Top controls: topic selector + year range slider + Generate Report button
 *   - 4 KPI cards (total papers, active authors, top journal, avg citations)
 *   - Main publications-per-year line chart (recharts)
 *   - Top journals + top authors bar charts (side by side)
 *   - Keyword cloud + geographic distribution
 *   - Recent breakthrough papers list
 */
export function TrendsPage() {
  return (
    <main className="container py-8">
      <PageHeader
        title="Trend dashboard"
        description="See how research topics are growing or fading over time."
        actions={
          <Button>
            Generate AI report
          </Button>
        }
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: KPI cards + line chart + journals/authors bars + keyword cloud
      </div>
    </main>
  );
}
