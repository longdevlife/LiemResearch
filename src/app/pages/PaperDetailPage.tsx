import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import { StatusBadge } from '../components/StatusBadge';
import { UploadPdfModal } from '../components/UploadPdfModal';
import { ArrowLeft, Download, Upload, Calendar, User, Link as LinkIcon, Star, X } from 'lucide-react';
import { apiRequest, getStoredUser, resolveFileUrl } from '../lib/api';
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
    university?: string;
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
  const [userComment, setUserComment] = useState('');
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isRemovingRating, setIsRemovingRating] = useState(false);
  const [reviewError, setReviewError] = useState('');
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
      setUserComment(existingUserRating?.comment || '');
      setExistingRatingId(existingUserRating?._id || null);
      setIsEditingReview(false);
      setReviewError('');
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

  const handleDeletePdf = async () => {
    if (!paper) return;

    setError('');
    setMessage('');

    try {
      const data = await apiRequest<{ paper: DetailPaper }>(`/papers/${paper._id}/pdf`, {
        method: 'DELETE',
        auth: true,
      });

      setPaper(data.paper);
      setMessage('PDF deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete PDF');
    }
  };

  const handleDownload = async () => {
    if (!paper) return;

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

  const handleRating = async (rating: number) => {
    if (!paper) return;

    setError('');
    setMessage('');
    setReviewError('');
    setUserRating(rating);
  };

  const handleSubmitRating = async () => {
    if (!paper) return;

    setError('');
    setMessage('');
    setReviewError('');

    if (userComment.trim() && userRating === 0) {
      setReviewError('Please choose a star rating before submitting a comment.');
      return;
    }

    if (userRating === 0) {
      setReviewError('Please choose a star rating to submit your review.');
      return;
    }

    setIsSubmittingRating(true);

    try {
      await apiRequest(existingRatingId ? `/ratings/${existingRatingId}` : `/ratings/papers/${paper._id}`, {
        method: existingRatingId ? 'PATCH' : 'POST',
        auth: true,
        body: JSON.stringify({ 
          rating: userRating,
          comment: userComment.trim()
        }),
      });

      setMessage(existingRatingId ? 'Review updated successfully.' : 'Review submitted successfully.');
      await loadPaper();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleStartUpdateReview = (rating: Rating) => {
    setUserRating(rating.rating);
    setUserComment(rating.comment || '');
    setExistingRatingId(rating._id);
    setIsEditingReview(true);
    setReviewError('');
    setError('');
    setMessage('');
  };

  const handleCancelReviewEdit = () => {
    const savedRating = ratings.find(r => r.user?._id === currentUser?._id);
    setUserRating(savedRating?.rating || 0);
    setUserComment(savedRating?.comment || '');
    setIsEditingReview(false);
    setReviewError('');
    setError('');
    setMessage('');
  };

  const handleRemoveReview = async (ratingId: string) => {
    setError('');
    setMessage('');
    setReviewError('');
    setIsRemovingRating(true);

    try {
      await apiRequest(`/ratings/${ratingId}`, {
        method: 'DELETE',
        auth: true,
      });

      setMessage('Review removed successfully.');
      setUserRating(0);
      setUserComment('');
      setExistingRatingId(null);
      setIsEditingReview(false);
      await loadPaper();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove review');
    } finally {
      setIsRemovingRating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-workspace bg-fixed">
      <Sidebar role={isAdmin ? 'admin' : 'user'} />

      <div className="flex-1 p-8">
        <AppHeader role={isAdmin ? 'admin' : 'user'} />
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
                    <div className="rounded-lg border border-border bg-white p-4">
                      <p className="text-sm text-muted-foreground">PDF UPLOADED BY :</p>
                      <p className="text-foreground">
                        {paper.uploadedBy?.fullName || 'N/A'}
                        {paper.uploadedBy?.university ? ` - ${paper.uploadedBy.university}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleDownload}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={20} />
                        Download PDF
                      </button>
                      {isAdmin ? (
                        <button
                          onClick={handleDeletePdf}
                          disabled={!paper.pdfPath}
                          className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            paper.pdfPath
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          }`}
                        >
                          <X size={20} />
                          Delete PDF
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-12 bg-muted text-center">
                    <p className="text-muted-foreground mb-4">No PDF yet</p>
                    {currentUser && !isAdmin && (
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Upload size={20} />
                        Upload PDF
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        disabled
                        className="bg-muted text-muted-foreground px-6 py-3 rounded-lg cursor-not-allowed flex items-center gap-2 mx-auto"
                      >
                        <X size={20} />
                        Delete PDF
                      </button>
                    )}
                    {!currentUser && <p className="text-sm text-muted-foreground">Sign in to upload the first PDF.</p>}
                  </div>
                )}
              </div>

              {!isAdmin && (
                <div className="bg-white rounded-lg border border-border shadow-sm p-8">
                  <h3 className="text-foreground mb-4">Review this paper</h3>

                  {!existingRatingId || isEditingReview ? (
                    <>
                      <div className="mb-6">
                        <p className="text-sm text-muted-foreground mb-3">Choose a star rating:</p>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRating(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="transition-transform hover:scale-110"
                              aria-label={`Choose ${star} star rating`}
                            >
                              <Star
                                size={40}
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
                          <p className="text-sm text-foreground mt-2">
                            Selected rating: {userRating} stars
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {reviewError && (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {reviewError}
                          </div>
                        )}

                        <label className="block">
                          <p className="text-sm font-medium text-foreground mb-2">Comment:</p>
                          <textarea
                            value={userComment}
                            onChange={(e) => {
                              setUserComment(e.target.value);
                              setReviewError('');
                            }}
                            placeholder="Share your thoughts about this paper..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-foreground bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <p className="text-xs text-gray-500 mt-1">{userComment.length}/500</p>
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSubmitRating}
                            disabled={isSubmittingRating}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmittingRating ? 'Submitting...' : isEditingReview ? 'Save review' : 'Submit review'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelReviewEdit}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-foreground hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">Your review is listed below. Use Update or Remove to manage it.</p>
                    </div>
                  )}
                </div>
              )}

              {ratings.length > 0 && (
                <div className="bg-white rounded-lg border border-border shadow-sm p-8 mt-6">
                  <h3 className="text-foreground mb-4">Ratings</h3>
                  <div className="space-y-3">
                    {ratings.map((rating) => {
                      const isOwnRating = rating.user?._id === currentUser?._id;

                      return (
                        <div
                          key={rating._id}
                          className={`rounded-lg border p-4 ${
                            isOwnRating
                              ? 'border-blue-300 bg-blue-50 shadow-sm'
                              : 'border-border bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-foreground">
                                {rating.user?.fullName || 'User'} rated {rating.rating} / 5
                                {isOwnRating && (
                                  <span className="ml-2 rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                                    Your review
                                  </span>
                                )}
                              </p>
                              {rating.comment && (
                                <p className="text-muted-foreground mt-1">{rating.comment}</p>
                              )}
                            </div>

                            {isOwnRating && (
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleStartUpdateReview(rating)}
                                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                  Update
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReview(rating._id)}
                                  disabled={isRemovingRating}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isRemovingRating ? 'Removing...' : 'Remove'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
