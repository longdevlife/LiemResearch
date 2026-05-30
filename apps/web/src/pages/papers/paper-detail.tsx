import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";

/**
 * Paper Detail page.
 *
 * Owner:        Dev 1 (Discovery)
 * Designed in:  docs/STITCH_PROMPTS.md → Web 4
 *
 * TODO:
 *   - Use usePaper(id) from @/features/papers
 *   - Hero: title + authors (with avatars) + metadata strip (journal, year, DOI, citations, open-access badge)
 *   - Action buttons: Bookmark / Follow topic / Add to project / Export / Share
 *   - AI Analysis card (highlighted, score breakdown bars)
 *   - Abstract section (body-lg, 75ch max-width)
 *   - Topics + keywords chips
 *   - References (collapsible)
 *   - Right sidebar: Similar papers / Author profile / Cited by
 */
export function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="container py-8">
      <PageHeader title="Paper detail" description={`Paper ID: ${id}`} />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: hero + AI analysis + abstract + references + similar papers sidebar
      </div>
    </main>
  );
}
