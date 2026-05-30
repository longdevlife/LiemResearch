import { PageHeader } from "@/components/page-header";

/**
 * Search Results page.
 *
 * Owner:        Dev 1 (Discovery)
 * Designed in:  docs/STITCH_PROMPTS.md → Web 3
 *
 * TODO:
 *   - Filter sidebar (left, 280px): search mode toggle (keyword/semantic),
 *     year range, open access, journal type, sources, AI score threshold
 *   - Main results: sort dropdown + active filter chips + paper card list
 *   - Use usePapers({ q, page, pageSize }) from @/features/papers
 *   - Pagination at bottom
 *   - Empty state when 0 results
 */
export function SearchPage() {
  return (
    <main className="container py-8">
      <PageHeader
        title="Search papers"
        description="Find research papers across multiple academic sources."
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: filter sidebar + paper results list with pagination
      </div>
    </main>
  );
}
