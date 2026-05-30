import { PageHeader } from "@/components/page-header";

/**
 * Research Gaps page — AI-identified gaps per topic.
 *
 * Owner:        Dev 3 (Research & Insights) — Phase D
 *
 * TODO (Phase D):
 *   - Topic selector at top
 *   - List of research_gap cards:
 *     each card has title, description, evidence preview, supporting paper IDs,
 *     suggested direction, confidence score
 *   - Filter by confidence threshold
 *   - Save gap to project action
 */
export function ResearchGapsPage() {
  return (
    <main className="container py-8">
      <PageHeader
        title="Research gaps"
        description="AI-suggested research opportunities grounded in retrieved papers."
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: topic selector + research gap cards with confidence + save-to-project
      </div>
    </main>
  );
}
