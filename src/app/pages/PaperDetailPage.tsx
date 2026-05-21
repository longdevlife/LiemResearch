import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { UploadPdfModal } from '../components/UploadPdfModal';
import { ArrowLeft, Download, Upload, Calendar, User, Link as LinkIcon, Star } from 'lucide-react';
import { apiRequest, getStoredUser } from '../lib/api';
import { PublicPaper } from '../lib/papers';

type DetailPaper = PublicPaper & {
  requestedBy?: {
    fullName?: string;
    email?: string;
    university?: string;
    studentId?: string;
  };
  uploadedBy?: {
    fullName?: string;
    email?: string;
  };
};

type Rating = {
  _id: string;
  rating: number;
  comment?: string;
  user?: {
    _id: string;
    fullName?: string;
    university?: string;
  };
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : 'N/A';
}

export function PaperDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 'admin';
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [paper, setPaper] = useState<DetailPaper | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPaper() {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      let paperData: { paper: DetailPaper };

      try {
        paperData = await apiRequest<{ paper: DetailPaper }>(`/papers/${id}`, { auth: true });
      } catch {
        paperData = await apiRequest<{ paper: DetailPaper }>(`/public-papers/${id}`, { auth: true });
      }

      const ratingsData = await apiRequest<{ ratings: Rating[] }>(`/ratings/papers/${id}`, { auth: true });
      const existingUserRating = ratingsData.ratings.find((rating) => rating.user?._id === currentUser?._id);

      setPaper(paperData.paper);
      setRatings(ratingsData.ratings);
      setUserRating(existingUserRating?.rating || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load paper detail');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPaper();
  }, [id]);

  const handleUploadPdf = async (file: File) => {
    if (!paper) return;

    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const data = await apiRequest<{ paper: DetailPaper }>(`/papers/${paper._id}/upload-pdf`, {
        method: 'POST',
        auth: true,
        body: formData,
      });

      setPaper(data.paper);
      setMessage('PDF uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload PDF');
    }
  };

  const handleDownload = async () => {
    if (!paper) return;

    try {
      const data = await apiRequest<{ downloadUrl: string }>(`/public-papers/${paper._id}/download`, {
        method: 'POST',
        auth: true,
      });
      window.open(`http://localhost:5000${data.downloadUrl}`, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download PDF');
    }
  };

  const handleRating = async (rating: number) => {
    if (!paper) return;

    setError('');
    setMessage('');

    try {
      await apiRequest(`/ratings/papers/${paper._id}`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ rating }),
      });

      setUserRating(rating);
      setMessage('Rating submitted successfully.');
      await loadPaper();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit rating');
    }
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

          {isLoading && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
              <p className="text-muted-foreground">Loading paper detail...</p>
            </div>
          )}

          {!isLoading && paper && (
            <>
              <div className="bg-white rounded-lg border border-border shadow-sm p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-foreground mb-4">{paper.title}</h1>
                    <div className="flex items-center gap-4 mb-4">
                      <StatusBadge status={paper.status} />
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            className={star <= Math.round(paper.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                        <span className="text-muted-foreground ml-2">
                          {paper.averageRating.toFixed(1)} ({paper.totalRatings} ratings)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-muted-foreground mb-1">DOI</p>
                      <p className="text-foreground">{paper.doi}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Publication Year</p>
                      <p className="text-foreground">{paper.publishedYear}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Paper Link</p>
                      <a href={paper.paperLink} className="text-primary hover:underline flex items-center gap-2">
                        <LinkIcon size={16} />
                        {paper.paperLink}
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Requested By</p>
                        <p className="text-foreground">{paper.requestedBy?.fullName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Request Date</p>
                        <p className="text-foreground">{formatDate(paper.createdAt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">University</p>
                      <p className="text-foreground">{paper.requestedBy?.university || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-foreground mb-3">Abstract</h3>
                  <p className="text-muted-foreground leading-relaxed">{paper.abstract}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-foreground mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.map((keyword) => (
                      <span
                        key={keyword}
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
                {paper.pdfPath ? (
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-8 bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground">PDF is available for download</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleDownload}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
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
                    {isAdmin && (
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Upload size={20} />
                        Upload PDF
                      </button>
                    )}
                  </div>
                )}
              </div>

              {paper.pdfPath && !isAdmin && (
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
                          disabled={userRating > 0}
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
                    {userRating > 0 ? 'You have already rated this paper.' : 'Click on the stars to rate this paper.'}
                  </p>
                </div>
              )}

              {ratings.length > 0 && (
                <div className="bg-white rounded-lg border border-border shadow-sm p-8 mt-6">
                  <h3 className="text-foreground mb-4">Ratings</h3>
                  <div className="space-y-3">
                    {ratings.map((rating) => (
                      <div key={rating._id} className="border border-border rounded-lg p-4">
                        <p className="text-foreground">{rating.user?.fullName || 'User'} rated {rating.rating} / 5</p>
                        {rating.comment && (
                          <p className="text-muted-foreground mt-1">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <UploadPdfModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUploadPdf}
          paperTitle={paper?.title || ''}
        />
      </div>
    </div>
  );
}
