import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";

/**
 * Project Detail page.
 *
 * Owner:        Dev 3 (Research & Insights) — Phase D
 *
 * TODO (Phase D):
 *   - Project header: title + description + member avatars
 *   - Tabs: Papers / Members / Saved Searches / Reports
 *   - Papers tab: list of project_papers, add paper button
 *   - Members tab: invite by email, list with roles
 *   - Generate report from project button
 */
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="container py-8">
      <PageHeader title="Project detail" description={`Project ID: ${id}`} />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: project header + tabs (papers, members, saved searches, reports)
      </div>
    </main>
  );
}
