import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";

/**
 * Report Viewer — single AI report with markdown body, citations, gaps.
 *
 * Owner:        Dev 3 (Research & Insights) — Phase C
 * Designed in:  docs/STITCH_PROMPTS.md → Web 6
 *
 * TODO (Phase C):
 *   - 3-column layout: TOC (left 240px) / main markdown body (center 720px) /
 *     metadata panel (right 280px)
 *   - Markdown render with inline citation footnotes [1]
 *   - Sticky TOC on scroll, highlight active section
 *   - Research gap cards section (callout style, accent border)
 *   - Action buttons: Export PDF / Export Markdown / Share
 *   - Verification badge ("AI-verified" if checks passed)
 */
export function ReportViewerPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="container py-8">
      <PageHeader title="Report viewer" description={`Report ID: ${id}`} />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: TOC sidebar + markdown body with citations + research gaps + export
      </div>
    </main>
  );
}
