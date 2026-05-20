import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { UploadPdfModal } from '../components/UploadPdfModal';
import { EditPaperModal } from '../components/EditPaperModal';
import { Search, Upload, Download, Eye, Filter, Check, X, Edit } from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  doi: string;
  requestedBy: string;
  university: string;
  studentId: string;
  status: 'pending' | 'downloaded' | 'not-downloaded' | 'approved' | 'rejected';
  requestDate: string;
}

const mockPapers: Paper[] = [
  {
    id: '1',
    title: 'Machine Learning Applications in Healthcare',
    doi: '10.1234/ml.healthcare.2024',
    requestedBy: 'John Doe',
    university: 'MIT',
    studentId: 'STU001',
    status: 'downloaded',
    requestDate: '2024-05-15',
  },
  {
    id: '2',
    title: 'Deep Neural Networks for Image Classification',
    doi: '10.1234/dnn.classification.2024',
    requestedBy: 'Jane Smith',
    university: 'Stanford',
    studentId: 'STU002',
    status: 'pending',
    requestDate: '2024-05-18',
  },
  {
    id: '3',
    title: 'Natural Language Processing in Modern Applications',
    doi: '10.1234/nlp.modern.2024',
    requestedBy: 'Bob Johnson',
    university: 'Harvard',
    studentId: 'STU003',
    status: 'approved',
    requestDate: '2024-05-10',
  },
  {
    id: '4',
    title: 'Computer Vision Techniques for Autonomous Vehicles',
    doi: '10.1234/cv.autonomous.2024',
    requestedBy: 'Alice Brown',
    university: 'Berkeley',
    studentId: 'STU004',
    status: 'pending',
    requestDate: '2024-05-19',
  },
  {
    id: '5',
    title: 'Quantum Computing Applications in Cryptography',
    doi: '10.1234/quantum.crypto.2024',
    requestedBy: 'Charlie Wilson',
    university: 'Caltech',
    studentId: 'STU005',
    status: 'rejected',
    requestDate: '2024-05-17',
  },
];

export function PaperManagementPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [papers, setPapers] = useState<Paper[]>(mockPapers);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.doi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || paper.status === filterStatus;

    const matchesYear = filterYear === 'all' || paper.requestDate.startsWith(filterYear);

    return matchesSearch && matchesStatus && matchesYear;
  });

  const years = Array.from(new Set(papers.map(p => p.requestDate.substring(0, 4)))).sort((a, b) => b.localeCompare(a));

  const handleApprove = (paperId: string) => {
    setPapers(papers.map(paper =>
      paper.id === paperId ? { ...paper, status: 'approved' as const } : paper
    ));
  };

  const handleReject = (paperId: string) => {
    setPapers(papers.map(paper =>
      paper.id === paperId ? { ...paper, status: 'rejected' as const } : paper
    ));
  };

  const handleOpenUploadModal = (paper: Paper) => {
    setSelectedPaper(paper);
    setUploadModalOpen(true);
  };

  const handleOpenEditModal = (paper: Paper) => {
    setSelectedPaper(paper);
    setEditModalOpen(true);
  };

  const handleUploadPdf = (file: File) => {
    if (selectedPaper) {
      setPapers(papers.map(paper =>
        paper.id === selectedPaper.id ? { ...paper, status: 'downloaded' as const } : paper
      ));
      alert(`PDF "${file.name}" uploaded successfully for "${selectedPaper.title}"`);
    }
  };

  const handleSaveEdit = (editedPaper: Paper) => {
    setPapers(papers.map(paper =>
      paper.id === editedPaper.id ? editedPaper : paper
    ));
    alert('Paper information updated successfully!');
  };

  const handleExportAll = () => {
    const csvContent = [
      ['Title', 'DOI', 'Requested By', 'University', 'Student ID', 'Date', 'Status'],
      ...papers.map(p => [p.title, p.doi, p.requestedBy, p.university, p.studentId, p.requestDate, p.status])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_papers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    alert(`Exported ${papers.length} papers to Excel`);
  };

  const handleExportNotDownloaded = () => {
    const notDownloaded = papers.filter(p => p.status !== 'downloaded');
    const csvContent = [
      ['Title', 'DOI', 'Requested By', 'University', 'Student ID', 'Date', 'Status'],
      ...notDownloaded.map(p => [p.title, p.doi, p.requestedBy, p.university, p.studentId, p.requestDate, p.status])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `not_downloaded_papers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    alert(`Exported ${notDownloaded.length} papers (not downloaded) to Excel`);
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
                  {years.map(year => (
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
                    <tr key={paper.id} className="border-b border-border hover:bg-accent transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{paper.title}</p>
                          <p className="text-muted-foreground">DOI: {paper.doi}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{paper.requestedBy}</p>
                          <p className="text-muted-foreground">ID: {paper.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{paper.university}</td>
                      <td className="px-6 py-4 text-muted-foreground">{paper.requestDate}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={paper.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/paper/${paper.id}`)}
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
                                onClick={() => handleApprove(paper.id)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Approve request"
                              >
                                <Check size={18} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => handleReject(paper.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Reject request"
                              >
                                <X size={18} className="text-red-600" />
                              </button>
                            </>
                          )}

                          {paper.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleOpenUploadModal(paper)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Upload PDF"
                              >
                                <Upload size={18} className="text-green-600" />
                              </button>
                            </>
                          )}

                          {paper.status === 'downloaded' && (
                            <button
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={18} className="text-blue-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPapers.length === 0 && (
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
