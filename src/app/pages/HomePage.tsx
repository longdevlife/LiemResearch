import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Download, Search, Star, TrendingUp } from 'lucide-react';
import { apiRequest, getStoredUser } from '../lib/api';
import { getPaperAuthors, getPaperJournal, PublicPaper } from '../lib/papers';

type SortOption = 'newest' | 'rating' | 'downloads';

const sortTabs: Array<{ label: string; value: SortOption }> = [
  { label: 'Latest', value: 'newest' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Downloaded', value: 'downloads' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function HomePage() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const logo = new URL('../../imports/Gemini_Generated_Image_s2fnqas2fnqas2fn.png', import.meta.url).href;
  const [papers, setPapers] = useState<PublicPaper[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPapers() {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        params.set('sortBy', sortBy);
        params.set('limit', '30');

        const query = selectedTag || searchTerm;
        if (query) params.set('search', query);

        const data = await apiRequest<{ papers: PublicPaper[] }>(`/public-papers?${params.toString()}`);

        if (isMounted) {
          setPapers(data.papers);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load papers');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const timeoutId = window.setTimeout(loadPapers, 200);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, selectedTag, sortBy]);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();

    for (const paper of papers) {
      for (const keyword of paper.keywords || []) {
        const normalized = keyword.trim();
        if (!normalized) continue;
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 12)
      .map(([keyword]) => keyword);
  }, [papers]);

  const handleOpenPaper = (paperId: string) => {
    if (currentUser) {
      navigate(`/paper/${paperId}`);
      return;
    }

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
          >
            <img src={logo} alt="LiemResearch" className="h-10 w-auto" />
            <span className="text-lg font-medium text-foreground">LiemResearch</span>
          </button>

          <div className="relative hidden flex-1 md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSelectedTag('');
              }}
              placeholder="Search papers by title, DOI, keyword, or journal..."
              className="w-full rounded-lg border border-border bg-input-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {currentUser ? (
            <button
              type="button"
              onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/dashboard')}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-blue-600"
            >
              Dashboard
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-lg border border-primary px-4 py-2 text-primary transition-colors hover:bg-accent"
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="hidden lg:block">
          <nav className="space-y-1">
            <button className="flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-2 text-left text-accent-foreground">
              <BookOpen size={18} />
              Papers
            </button>
            <button
              type="button"
              onClick={() => setSortBy('rating')}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              <Star size={18} />
              Top Rated
            </button>
            <button
              type="button"
              onClick={() => setSortBy('downloads')}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              <TrendingUp size={18} />
              Popular
            </button>
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSelectedTag('');
                }}
                placeholder="Search papers..."
                className="w-full rounded-lg border border-border bg-input-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 border-b border-border">
            {sortTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSortBy(tab.value)}
                className={`border-b-2 px-3 py-3 text-sm transition-colors ${
                  sortBy === tab.value
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="rounded-lg border border-border bg-white p-8 text-center text-muted-foreground">
              Loading papers...
            </div>
          )}

          <div className="space-y-4">
            {papers.map((paper) => (
              <article key={paper._id} className="rounded-lg border border-border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{getPaperAuthors(paper)}</span>
                  <span>{formatDate(paper.createdAt)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPaper(paper._id)}
                  className="mb-2 block text-left text-xl font-medium leading-snug text-foreground transition-colors hover:text-primary"
                >
                  {paper.title}
                </button>

                <p className="mb-3 line-clamp-3 text-muted-foreground">{paper.abstract}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {paper.keywords.slice(0, 5).map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => {
                        setSelectedTag(keyword);
                        setSearchTerm('');
                      }}
                      className="rounded-md bg-accent px-2 py-1 text-sm text-accent-foreground transition-colors hover:bg-blue-200"
                    >
                      #{keyword}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-4">
                    <span>{getPaperJournal(paper)}</span>
                    <span>{paper.publishedYear}</span>
                    <span>{paper.averageRating.toFixed(1)} rating</span>
                    <span>{paper.downloadCount} downloads</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPaper(paper._id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-accent"
                  >
                    Read more
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!isLoading && papers.length === 0 && (
            <div className="rounded-lg border border-border bg-white p-10 text-center">
              <Search size={40} className="mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-foreground">No papers found</h3>
              <p className="mt-1 text-muted-foreground">Try another keyword or browse the latest papers.</p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-foreground">Popular Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(tag);
                    setSearchTerm('');
                  }}
                  className={`rounded-md px-2 py-1 text-sm transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {popularTags.length === 0 && <p className="text-sm text-muted-foreground">No keywords yet.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-foreground">Join LiemResearch</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Sign in to request papers, upload PDFs, rate research, and track your contribution points.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-blue-600"
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg border border-border px-4 py-2 text-foreground transition-colors hover:bg-accent"
              >
                Log in
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
