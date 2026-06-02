import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, BookOpen, Search, Star, TrendingUp, X } from 'lucide-react';
import { apiRequest, getStoredUser } from '../lib/api';
import { PublicPaper } from '../lib/papers';
import { PaperCard } from '../components/PaperCard';
import { Footer } from '../components/Footer';
import { HomeLandingSections } from '../components/HomeLandingSections';

type SortOption = 'newest' | 'rating' | 'downloads';

const sortTabs: Array<{ label: string; value: SortOption }> = [
  { label: 'Latest', value: 'newest' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Downloaded', value: 'downloads' },
];

const sortCopy = {
  newest: {
    title: 'Latest papers',
    description: 'Recently approved research materials from the community library.',
    icon: BookOpen,
  },
  rating: {
    title: 'Highly rated papers',
    description: 'Research papers ranked highest by the community.',
    icon: Star,
  },
  downloads: {
    title: 'Popular papers',
    description: 'The most downloaded materials in the collection.',
    icon: TrendingUp,
  },
} satisfies Record<SortOption, { title: string; description: string; icon: typeof BookOpen }>;

const popularActions = [
  { label: 'REQUEST', path: '/request-paper' },
  { label: 'CONTRIBUTE PDF', path: '/request-paper?mode=contribute' },
  { label: 'RANKING', path: '/rankings' },
];

export function HomePage() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const logo = new URL('../../imports/liemresearch-logo.png', import.meta.url).href;
  const [papers, setPapers] = useState<PublicPaper[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedTag, sortBy]);

  useEffect(() => {
    let isMounted = true;

    async function loadPapers() {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        params.set('sortBy', sortBy);
        params.set('page', String(page));
        params.set('limit', '5');

        const query = selectedTag || searchTerm;
        if (query) params.set('search', query);

        const data = await apiRequest<{ papers: PublicPaper[]; pagination?: { page?: number; totalPages?: number } }>(
          `/public-papers?${params.toString()}`
        );

        if (isMounted) {
          setPapers(data.papers);
          setPage(data.pagination?.page ?? page);
          setTotalPages(data.pagination?.totalPages ?? 1);
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
  }, [page, searchTerm, selectedTag, sortBy]);

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

  const activeSort = sortCopy[sortBy];
  const ActiveSortIcon = activeSort.icon;

  return (
    <div className="min-h-screen bg-surface-feed text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          >
            <img src={logo} alt="LiemResearch" className="h-9 w-auto lg:h-10" />
            <span className="text-base font-semibold tracking-tight text-foreground lg:text-lg">LiemResearch</span>
          </button>

          <div className="relative ml-3 hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSelectedTag('');
              }}
              placeholder="Search papers by title, DOI, or keyword..."
              maxLength={128}
              className="w-full rounded-full border border-border bg-[color:var(--input-background)] py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(122,111,97,0.12)]"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/dashboard')}
                className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:opacity-90"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="hidden rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:block"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 lg:px-5 lg:pb-10 lg:pt-10">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_300px] lg:items-start">
            <div>
              <span className="inline-flex items-center rounded-full border border-border/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Community papers
              </span>

              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] text-foreground md:text-5xl lg:text-6xl">
                Explore a community-built library of scientific papers.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Search, request, and share research materials. Earn points for contributing as we build
                an open knowledge library together.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(currentUser ? '/request-paper' : '/login')}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
                >
                  Request papers
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(currentUser ? '/request-paper?mode=contribute' : '/login')}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  Contribute PDF
                </button>
              </div>

            </div>

            <aside className="rounded-2xl border border-border/80 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Get started</p>
              <div className="mt-4 space-y-3.5">
                <div className="relative md:hidden">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setSelectedTag('');
                    }}
                    placeholder="Search papers..."
                    maxLength={128}
                    className="w-full rounded-full border border-border bg-[color:var(--input-background)] py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(122,111,97,0.12)]"
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/70 p-3.5">
                  <p className="text-sm font-medium text-foreground">Popular actions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {popularActions.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!currentUser && (
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-3.5 text-foreground">
                    <p className="text-sm font-semibold text-foreground">Sign in to save your history and download PDFs.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:opacity-80"
                    >
                      Sign in now
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-14">
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-[1.75rem] border border-border/80 bg-white/75 p-3.5 shadow-sm backdrop-blur">
                <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Sort by</p>
                <nav className="space-y-1">
                  {sortTabs.map((item) => {
                    const Icon = sortCopy[item.value].icon;
                    const isActive = sortBy === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSortBy(item.value)}
                        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-4 rounded-[1.75rem] border border-border/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Latest papers</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                        <ActiveSortIcon size={20} />
                      </div>
                      <div>
                        <h2 className="text-2xl text-foreground">{activeSort.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{activeSort.description}</p>
                      </div>
                    </div>
                  </div>

                  {(selectedTag || searchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTag('');
                        setSearchTerm('');
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      <X size={16} />
                      Clear filters
                    </button>
                  )}
                </div>

                {(selectedTag || searchTerm) && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
                    <span className="text-sm text-muted-foreground">Showing results for</span>
                    <span className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
                      {selectedTag ? `#${selectedTag}` : searchTerm}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              {isLoading && (
                <div className="rounded-2xl border border-border bg-white/75 p-8 text-center text-muted-foreground">
                  Loading papers...
                </div>
              )}

              <div className="space-y-4">
                {papers.map((paper) => (
                  <PaperCard
                    key={paper._id}
                    paper={paper}
                    onOpen={(selectedPaper) => handleOpenPaper(selectedPaper._id)}
                    onTagClick={(keyword) => {
                      setSelectedTag(keyword);
                      setSearchTerm('');
                    }}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col gap-4 rounded-[1.75rem] border border-border/80 bg-white/75 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                      disabled={page === 1 || isLoading}
                      className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                      disabled={page === totalPages || isLoading}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {!isLoading && papers.length === 0 && (
                <div className="rounded-2xl border border-border bg-white/75 p-8 text-center">
                  <Search size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-foreground">No papers yet.</h3>
                  <p className="mt-1 text-muted-foreground">Try another keyword or come back later.</p>
                </div>
              )}
            </section>

            <aside className="space-y-3.5">
              <div className="rounded-[1.75rem] border border-border/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <h3 className="mb-3 text-foreground">Popular keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTag(tag);
                        setSearchTerm('');
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        selectedTag === tag
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {popularTags.length === 0 && <p className="text-sm text-muted-foreground">No keywords yet.</p>}
                </div>
              </div>

              {!currentUser && (
                <div className="rounded-[1.75rem] border border-border/80 bg-white/85 p-4 text-foreground shadow-sm backdrop-blur">
                  <h3 className="mb-2 text-foreground">Join LiemResearch</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Request papers, download PDFs, and earn contribution points.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Create account
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="mt-3 block text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-opacity hover:opacity-75"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        <HomeLandingSections />
      </main>
      <Footer />
    </div>
  );
}
