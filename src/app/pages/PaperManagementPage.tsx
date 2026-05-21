import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { UploadPdfModal } from '../components/UploadPdfModal';
import { EditablePaper, EditPaperModal } from '../components/EditPaperModal';
import { Search, Upload, Download, Eye, Filter, Check, X, Edit, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api';

type PaperStatus = 'pending' | 'downloaded' | 'not-downloaded' | 'approved' | 'rejected';

interface AdminPaper extends EditablePaper {
  requestedBy?: {
    fullName?: string;
    email?: string;
    university?: string;
    studentId?: string;
  };
  pdfPath?: string;
  createdAt: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
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

  const handleDelete = async (paper: AdminPaper) => {
    const confirmed = window.confirm(`Delete "${paper.title}"?`);
    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      await apiRequest(`/papers/${paper._id}`, {
        method: 'DELETE',
        auth: true,
      });

      setPapers(papers.filter((item) => item._id !== paper._id));
      setMessage('Paper deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete paper');
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
        formatDate(paper.createdAt),
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
    exportPapers(notDownloaded, `not_downloaded_papers_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" />

      <div className="flex-1 p-8">
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
                Export Not Downloaded
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
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="downloaded">Downloaded</option>
                  <option value="not-downloaded">Not Downloaded</option>
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
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(paper.createdAt)}</td>
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

                          {paper.status === 'approved' && (
                            <button
                              onClick={() => handleOpenUploadModal(paper)}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Upload PDF"
                            >
                              <Upload size={18} className="text-green-600" />
                            </button>
                          )}

                          {paper.status === 'downloaded' && paper.pdfPath && (
                            <a
                              href={`http://localhost:5000${paper.pdfPath}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={18} className="text-blue-600" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDelete(paper)}
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
      </div>
    </div>
  );
}
