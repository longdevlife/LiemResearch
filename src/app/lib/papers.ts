export type PublicPaper = {
  _id: string;
  title: string;
  doi: string;
  paperLink: string;
  abstract: string;
  authors?: string[];
  journal?: string;
  keywords: string[];
  publishedYear: number;
  status: 'pending' | 'approved' | 'rejected' | 'downloaded' | 'not-downloaded';
  pdfPath?: string;
  uploadedBy?: {
    _id: string;
    fullName?: string;
    university?: string;
    email?: string;
  };
  requestedBy?: {
    _id: string;
    fullName?: string;
    university?: string;
    email?: string;
  };
  uploadedAt?: string;
  averageRating: number;
  totalRatings: number;
  downloadCount: number;
  createdAt: string;
};

export function getPaperAuthors(paper: PublicPaper) {
  if (paper.authors && paper.authors.length > 0) {
    return paper.authors.join(', ');
  }

  return paper.requestedBy?.fullName ? `Requested by ${paper.requestedBy.fullName}` : 'Requested by unknown user';
}

export function getPaperJournal(paper: PublicPaper) {
  return paper.journal || 'Unspecified journal';
}

export function getPdfUrl(pdfPath?: string) {
  if (!pdfPath) return '';
  if (/^https?:\/\//i.test(pdfPath)) return pdfPath;

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${new URL(apiBaseUrl).origin}${pdfPath}`;
}
