import { PageHeader } from "@/components/page-header";

/**
 * Bookmarks page — saved papers, topics, authors, journals.
 *
 * Owner:        Dev 2 (Personalization) — Phase D
 *
 * TODO (Phase D):
 *   - Filter tabs: All / Papers / Topics / Authors / Journals
 *   - Grid of bookmark cards (each: icon + title + metadata + delete)
 *   - Bulk select + bulk delete
 *   - Empty state
 */
export function BookmarksPage() {
  return (
    <main className="container py-8">
      <PageHeader
        title="Bookmarks"
        description="Items you've saved to revisit later."
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: filter tabs + bookmark grid + empty state
      </div>
    </main>
  );
}
