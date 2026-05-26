import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import { StatusBadge } from '../components/StatusBadge';
import { UploadPdfModal } from '../components/UploadPdfModal';
import { EditablePaper, EditPaperModal } from '../components/EditPaperModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Search, Upload, Download, Eye, Filter, Check, X, Edit, Trash2 } from 'lucide-react';
import { apiRequest, resolveFileUrl } from '../lib/api';
import { formatDisplayDate } from '../lib/date';

type PaperStatus = 'pending' | 'downloaded' | 'not-downloaded' | 'approved' | 'rejected';

interface AdminPaper extends EditablePaper {
  requestedBy?: {
    fullName?: string;
    email?: string;
    university?: string;
    studentId?: string;
  };
  pdfPath?: string;
  uploadedBy?: {
    fullName?: string;
    university?: string;
  };
  createdAt: string;
}

function toCsvValue(value: string | number | undefined) {
  const text = String(value || '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function PaperManagementPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<AdminPaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paperToDelete, setPaperToDelete] = useState<AdminPaper | null>(null);
  const [isDeletingPaper, setIsDeletingPaper] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPapers() {
    setIsLoading(true);
    setError('');

    try {
      const data = await apiRequest<{ papers: AdminPaper[] }>('/papers', { auth: true });
      setPapers(data.papers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load papers');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPapers();
  }, []);

  const filteredPapers = papers.filter((paper) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const requesterName = paper.requestedBy?.fullName || '';
    const matchesSearch =
      paper.title.toLowerCase().includes(normalizedSearch) ||
      paper.doi.toLowerCase().includes(normalizedSearch) ||
      requesterName.toLowerCase().includes(normalizedSearch);

    const matchesStatus = filterStatus === 'all' || paper.status === filterStatus;
    const matchesYear = filterYear === 'all' || paper.createdAt.startsWith(filterYear);

    return matchesSearch && matchesStatus && matchesYear;
  });

  const years = Array.from(new Set(papers.map((paper) => paper.createdAt.substring(0, 4)))).sort((a, b) =>
    b.localeCompare(a)
  );

  const updatePaperStatus = async (paperId: string, status: PaperStatus) => {
    setError('');
    setMessage('');

    try {
      const data = await apiRequest<{ paper: AdminPaper }>(`/papers/${paperId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status }),
      });

      setPapers(papers.map((paper) => (paper._id === paperId ? data.paper : paper)));
      setMessage('Paper status updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status');
    }
  };

  const handleOpenUploadModal = (paper: AdminPaper) => {
    setSelectedPaper(paper);
    setUploadModalOpen(true);
  };

  const handleOpenEditModal = (paper: AdminPaper) => {
    setSelectedPaper(paper);
    setEditModalOpen(true);
  };

  const handleOpenPdf = async (paper: AdminPaper) => {
    setError('');

    try {
      const data = await apiRequest<{ downloadUrl: string }>(`/papers/${paper._id}/pdf-url`, {
        auth: true,
      });

      window.open(resolveFileUrl(data.downloadUrl), '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open PDF');
    }
  };

  const handleUploadPdf = async (file: File) => {
    if (!selectedPaper) return;

    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const data = await apiRequest<{ paper: AdminPaper }>(`/papers/${selectedPaper._id}/upload-pdf`, {
        method: 'POST',
        auth: true,
        body: formData,
      });

      setPapers(papers.map((paper) => (paper._id === selectedPaper._id ? data.paper : paper)));
      setMessage('PDF uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload PDF');
    }
  };

  const handleDeletePdf = async (paper: AdminPaper) => {
    setError('');
    setMessage('');

    try {
      const data = await apiRequest<{ paper: AdminPaper }>(`/papers/${paper._id}/pdf`, {
        method: 'DELETE',
        auth: true,
      });

      setPapers(papers.map((item) => (item._id === paper._id ? data.paper : item)));
      setMessage('PDF deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete PDF');
    }
  };

  const handleSaveEdit = async (editedPaper: EditablePaper) => {
    setError('');
    setMessage('');

    try {
      const data = await apiRequest<{ paper: AdminPaper }>(`/papers/${editedPaper._id}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          title: editedPaper.title,
          doi: editedPaper.doi,
          paperLink: editedPaper.paperLink,
          abstract: editedPaper.abstract,
          keywords: editedPaper.keywords,
          publishedYear: editedPaper.publishedYear,
          status: editedPaper.status,
        }),
      });

      setPapers(papers.map((paper) => (paper._id === editedPaper._id ? data.paper : paper)));
      setMessage('Paper information updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update paper');
    }
  };

  const handleDelete = async () => {
    if (!paperToDelete) return;

    setError('');
    setMessage('');
    setIsDeletingPaper(true);

    try {
      await apiRequest(`/papers/${paperToDelete._id}`, {
        method: 'DELETE',
        auth: true,
      });

      setPapers(papers.filter((item) => item._id !== paperToDelete._id));
      setPaperToDelete(null);
      setMessage('Paper deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete paper');
    } finally {
      setIsDeletingPaper(false);
    }
  };

  const exportPapers = (items: AdminPaper[], filename: string) => {
    const csvContent = [
      ['Title', 'DOI', 'Requested By', 'University', 'Student ID', 'Date', 'Status'],
      ...items.map((paper) => [
        paper.title,
        paper.doi,
        paper.requestedBy?.fullName,
        paper.requestedBy?.university,
        paper.requestedBy?.studentId,
        formatDisplayDate(paper.createdAt),
        paper.status,
      ]),
    ]
      .map((row) => row.map(toCsvValue).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    exportPapers(papers, `all_papers_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportNotDownloaded = () => {
    const notDownloaded = papers.filter((paper) => paper.status !== 'downloaded');
    exportPapers(notDownloaded, `no_pdf_yet_papers_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="flex min-h-screen bg-surface-workspace bg-fixed">
      <Sidebar role="admin" />

      <div className="flex-1 p-8">
        <AppHeader role="admin" />
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-foreground mb-2">Paper Management</h1>
              <p className="text-muted-foreground">Manage and track all research paper requests</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportNotDownloaded}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                <Download size={20} />
                Export No PDF Yet
              </button>
              <button
                onClick={handleExportAll}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download size={20} />
                Export All
              </button>
            </div>
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

          <div className="bg-white rounded-lg border border-border shadow-sm p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, DOI, or requester..."
                  maxLength={128}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected</option>
                  <option value="downloaded">PDF available</option>
                  <option value="not-downloaded">No PDF yet</option>
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background appearance-none"
                >
                  <option value="all">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-foreground">Paper Title</th>
                    <th className="px-6 py-4 text-left text-foreground">Requested By</th>
                    <th className="px-6 py-4 text-left text-foreground">University</th>
                    <th className="px-6 py-4 text-left text-foreground">Date</th>
                    <th className="px-6 py-4 text-left text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPapers.map((paper) => (
                    <tr key={paper._id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{paper.title}</p>
                          <p className="text-muted-foreground">DOI: {paper.doi}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{paper.requestedBy?.fullName || 'Unknown'}</p>
                          <p className="text-muted-foreground">ID: {paper.requestedBy?.studentId || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{paper.requestedBy?.university || 'N/A'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDisplayDate(paper.createdAt)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={paper.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/paper/${paper._id}`)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={18} className="text-primary" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(paper)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit paper"
                          >
                            <Edit size={18} className="text-blue-600" />
                          </button>

                          {paper.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updatePaperStatus(paper._id, 'approved')}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Approve request"
                              >
                                <Check size={18} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => updatePaperStatus(paper._id, 'rejected')}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Reject request"
                              >
                                <X size={18} className="text-red-600" />
                              </button>
                            </>
                          )}

                          {/* Delete PDF button removed from row actions per UX request */}

                          {paper.pdfPath && (
                            <button
                              type="button"
                              onClick={() => handleOpenPdf(paper)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={18} className="text-blue-600" />
                            </button>
                          )}

                          <button
                            onClick={() => setPaperToDelete(paper)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete paper"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isLoading && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Loading papers...</p>
              </div>
            )}

            {!isLoading && filteredPapers.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No papers found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        <UploadPdfModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUploadPdf}
          paperTitle={selectedPaper?.title || ''}
        />

        <EditPaperModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
          paper={selectedPaper}
        />

        <ConfirmDialog
          isOpen={Boolean(paperToDelete)}
          title="Delete paper?"
          description={`This will permanently delete "${paperToDelete?.title || 'this paper'}".`}
          confirmLabel="Delete paper"
          isLoading={isDeletingPaper}
          onConfirm={handleDelete}
          onCancel={() => setPaperToDelete(null)}
        />
      </div>
    </div>
  );
}
