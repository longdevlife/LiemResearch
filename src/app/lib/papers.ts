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
  averageRating: number;
  totalRatings: number;
  downloadCount: number;
  createdAt: string;
};

export function getPaperAuthors(paper: PublicPaper) {
  return paper.authors && paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
}

export function getPaperJournal(paper: PublicPaper) {
  return paper.journal || 'Unspecified journal';
}

export function getPdfUrl(pdfPath?: string) {
  return pdfPath ? `http://localhost:5000${pdfPath}` : '';
}
