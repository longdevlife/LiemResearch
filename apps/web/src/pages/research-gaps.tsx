import { PageHeader } from "@/components/page-header";
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
