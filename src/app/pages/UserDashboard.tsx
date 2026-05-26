import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import { SubNavbar } from '../components/SubNavbar';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { PaperCard } from '../components/PaperCard';
import { LoadingSkeleton } from '../components/LoadingSpinner';
import { apiRequest, resolveFileUrl } from '../lib/api';
import { PublicPaper } from '../lib/papers';
import { Search, Plus, Download as DownloadIcon, Filter } from 'lucide-react';

type FeedTab = 'newest' | 'rating' | 'downloads' | 'hasPdf';

const feedTabs: Array<{ label: string; value: FeedTab }> = [
  { label: 'Latest', value: 'newest' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Downloaded', value: 'downloads' },
  { label: 'Has PDF', value: 'hasPdf' },
];

export function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<FeedTab>('newest');
  const [papers, setPapers] = useState<PublicPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.loginSuccess) {
      setMessage('Logged in successfully.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  async function loadPapers() {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (yearFilter !== 'all') params.set('year', yearFilter);
      if (activeTab === 'hasPdf') {
        params.set('hasPdf', 'true');
        params.set('sortBy', 'newest');
      } else {
        params.set('sortBy', activeTab);
      }
      params.set('limit', '100');

      const data = await apiRequest<{ papers: PublicPaper[] }>(`/public-papers?${params.toString()}`, {
        auth: true,
      });
      setPapers(data.papers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load papers');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPapers();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, yearFilter, activeTab]);

  const years = Array.from(new Set(papers.map((paper) => String(paper.publishedYear)))).sort((a, b) =>
    b.localeCompare(a)
  );

  const handleDownload = async (paper: PublicPaper) => {
    try {
      const data = await apiRequest<{ downloadUrl: string }>(`/public-papers/${paper._id}/download`, {
        method: 'POST',
        auth: true,
      });

      const fileUrl = resolveFileUrl(data.downloadUrl);
      const resp = await fetch(fileUrl);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paper.doi || paper.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download PDF');
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-workspace bg-fixed">
      <Sidebar role="user" />

      <div className="flex-1">
        <AppHeader role="user" />
        <SubNavbar 
          items={feedTabs}
          activeValue={activeTab}
          onSelect={(value) => setActiveTab(value as FeedTab)}
          title="Filter by"
        />
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Browse research papers and request what you need.</p>
            </div>
            <button
              onClick={() => navigate('/request-paper')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Request Paper
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6">
              {message}
            </div>
          )}

          <div className="mb-6 rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, author, DOI, keywords, or journal..."
                  maxLength={128}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                />
              </div>
              <div className="relative lg:w-48">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background appearance-none"
                >
                  <option value="all">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading papers...' : `Showing ${papers.length} paper${papers.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : papers.length === 0 ? (
            <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
              <Search size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-foreground mb-2">No papers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {papers.map((paper) => (
                <PaperCard
                  key={paper._id}
                  paper={paper}
                  variant="dashboard"
                  onOpen={(selectedPaper) => navigate(`/paper/${selectedPaper._id}`)}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
