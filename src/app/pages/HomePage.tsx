import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, BookOpen, Search, Star, TrendingUp, X } from 'lucide-react';
import { apiRequest, getStoredUser } from '../lib/api';
import { PublicPaper } from '../lib/papers';
import { PaperCard } from '../components/PaperCard';

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
};

const navigationItems = [
  { label: 'EXPLORE', value: 'explore' },
  { label: 'REQUEST', value: 'request' },
  { label: 'RANKING', value: 'ranking' },
];

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

  const activeSort = sortCopy[sortBy];
  const ActiveSortIcon = activeSort.icon;

  return (
    <div className="min-h-screen bg-surface-feed text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3.5 lg:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          >
            <img src={logo} alt="LiemResearch" className="h-9 w-auto lg:h-10" />
            <span className="text-base font-semibold tracking-tight text-foreground lg:text-lg">LiemResearch</span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex">
            {navigationItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  if (item.value === 'explore') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }

                  if (item.value === 'ranking') {
                    navigate('/rankings');
                    return;
                  }

                  navigate('/request-paper');
                }}
                className="text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="relative hidden flex-1 xl:block">
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
                className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Create Account
              </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-5 pb-12 pt-14 lg:px-6 lg:pb-16 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:items-start">
            <div>
              <span className="inline-flex items-center rounded-full border border-border/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Community papers
              </span>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.95] text-foreground md:text-6xl lg:text-7xl">
                Explore a community-built library of scientific papers.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                Search, request, and share research materials. Earn points for contributing as we build
                an open knowledge library together.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
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
                  onClick={() => navigate(currentUser ? '/request-paper' : '/login')}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  Contribute PDF
                </button>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  'Search by title, DOI, keyword, or paper type.',
                  'Rank results by community ratings and download volume.',
                  'Share PDFs to support other research groups.',
                ].map((copy) => (
                  <div key={copy} className="rounded-2xl border border-border/80 bg-white/65 p-4 text-sm leading-6 text-muted-foreground shadow-sm">
                    {copy}
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-border/80 bg-white/75 p-6 shadow-[0_20px_60px_rgba(31,29,26,0.08)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Quick search</p>
              <div className="mt-5 space-y-4">
                <div className="relative xl:hidden">
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

                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-sm font-medium text-foreground">Popular actions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {navigationItems.slice(1).map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          if (item.value === 'ranking') {
                            navigate('/rankings');
                            return;
                          }

                          navigate('/request-paper');
                        }}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!currentUser && (
                  <div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
                    <p className="text-sm font-semibold">Sign in to save your history and download PDFs.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline decoration-white/40 underline-offset-4"
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

        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-[1.75rem] border border-border/80 bg-white/75 p-4 shadow-sm backdrop-blur">
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
              <div className="mb-4 rounded-[1.75rem] border border-border/80 bg-white/75 p-5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Latest papers</p>
                    <div className="mt-2 flex items-center gap-3">
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
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
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

              {!isLoading && papers.length === 0 && (
                <div className="rounded-2xl border border-border bg-white/75 p-10 text-center">
                  <Search size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-foreground">No papers yet.</h3>
                  <p className="mt-1 text-muted-foreground">Try another keyword or come back later.</p>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] border border-border/80 bg-white/75 p-5 shadow-sm backdrop-blur">
                <h3 className="mb-3 text-foreground">Popular keywords</h3>
                <div className="flex flex-wrap gap-2">
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
                <div className="rounded-[1.75rem] border border-border/80 bg-primary p-5 text-primary-foreground shadow-sm">
                  <h3 className="mb-2 text-primary-foreground">Join LiemResearch</h3>
                  <p className="mb-4 text-sm text-primary-foreground/80">
                    Sign in to request papers, download PDFs, rate research, and track your contribution points.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-accent"
                    >
                      Create account
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/10"
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
