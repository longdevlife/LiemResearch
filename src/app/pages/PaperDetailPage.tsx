import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { UploadPdfModal } from '../components/UploadPdfModal';
import { ArrowLeft, Download, Upload, Calendar, User, Link as LinkIcon, Star } from 'lucide-react';

export function PaperDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const [mockPaper, setMockPaper] = useState({
    id: id || '1',
    title: 'Machine Learning Applications in Healthcare: A Systematic Review',
    doi: '10.1234/ml.healthcare.2024',
    link: 'https://example.com/paper',
    abstract: 'This systematic review explores the various applications of machine learning in healthcare, including diagnostic systems, treatment planning, and patient monitoring. The study analyzes 150 research papers published between 2020 and 2024, identifying key trends and future directions in the field.',
    keywords: ['machine learning', 'healthcare', 'artificial intelligence', 'medical diagnosis'],
    year: '2024',
    requestedBy: 'John Doe',
    university: 'MIT',
    studentId: 'STU123456',
    requestDate: '2024-05-15',
    status: 'downloaded' as const,
    pdfAvailable: true,
    rating: 4.5,
    ratingCount: 23,
  });

  const isAdmin = window.location.pathname.includes('admin');

  const handleUploadPdf = (file: File) => {
    setMockPaper({ ...mockPaper, pdfAvailable: true });
    alert(`PDF "${file.name}" uploaded successfully!`);
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    const newRatingCount = mockPaper.ratingCount + 1;
    const newRating = ((mockPaper.rating * mockPaper.ratingCount) + rating) / newRatingCount;
    setMockPaper({
      ...mockPaper,
      rating: newRating,
      ratingCount: newRatingCount,
    });
    alert(`You rated this paper ${rating} stars!`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={isAdmin ? 'admin' : 'user'} />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(isAdmin ? '/admin/papers' : '/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to {isAdmin ? 'Paper Management' : 'Dashboard'}
          </button>

          <div className="bg-white rounded-lg border border-border shadow-sm p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-foreground mb-4">{mockPaper.title}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <StatusBadge status={mockPaper.status} />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={star <= Math.round(mockPaper.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                    <span className="text-muted-foreground ml-2">
                      {mockPaper.rating.toFixed(1)} ({mockPaper.ratingCount} ratings)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-1">DOI</p>
                  <p className="text-foreground">{mockPaper.doi}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Publication Year</p>
                  <p className="text-foreground">{mockPaper.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Paper Link</p>
                  <a href={mockPaper.link} className="text-primary hover:underline flex items-center gap-2">
                    <LinkIcon size={16} />
                    {mockPaper.link}
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Requested By</p>
                    <p className="text-foreground">{mockPaper.requestedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Request Date</p>
                    <p className="text-foreground">{mockPaper.requestDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">University</p>
                  <p className="text-foreground">{mockPaper.university}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-foreground mb-3">Abstract</h3>
              <p className="text-muted-foreground leading-relaxed">{mockPaper.abstract}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-foreground mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {mockPaper.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded-full border border-border"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm p-8 mb-6">
            <h3 className="text-foreground mb-4">PDF Document</h3>
            {mockPaper.pdfAvailable ? (
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-8 bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">PDF Preview Area</p>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                    <Download size={20} />
                    Download PDF
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setUploadModalOpen(true)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload size={20} />
                      Upload New PDF
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-12 bg-muted text-center">
                <p className="text-muted-foreground mb-4">No PDF available yet</p>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Upload size={20} />
                  Upload PDF
                </button>
              </div>
            )}
          </div>

          {mockPaper.pdfAvailable && !isAdmin && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-8">
              <h3 className="text-foreground mb-4">Rate This Paper</h3>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={
                          star <= (hoveredRating || userRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <span className="text-foreground ml-2">
                    You rated: {userRating} star{userRating !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-3">
                Click on the stars to rate this paper (1-5 stars)
              </p>
            </div>
          )}
        </div>

        <UploadPdfModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUploadPdf}
          paperTitle={mockPaper.title}
        />
      </div>
    </div>
  );
}
