import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

/**
 * Projects List page — researcher-only feature.
 *
 * Owner:        Dev 3 (Research & Insights) — Phase D
 *
 * TODO (Phase D):
 *   - "New project" button → dialog with title, topic, description
 *   - Grid of project cards (each: title, member count, paper count, last activity)
 *   - Filter chips: Active / Archived
 *   - Empty state for new researchers
 */
export function ProjectsListPage() {
  return (
    <main className="container py-8">
      <PageHeader
        title="Research projects"
        description="Organise papers, members, and reports under one project."
        actions={<Button>New project</Button>}
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: project grid + new-project dialog + filters
      </div>
    </main>
  );
}
