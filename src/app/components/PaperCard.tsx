import { Calendar, Download, Eye, FileText, MessageCircle, Star } from 'lucide-react';
import { formatDisplayDate } from '../lib/date';
import { getPaperAuthors, getPaperJournal, PublicPaper } from '../lib/papers';
import ExpandableText from './ExpandableText';

type PaperCardProps = {
  paper: PublicPaper;
  onOpen: (paper: PublicPaper) => void;
  onDownload?: (paper: PublicPaper) => void;
  onTagClick?: (tag: string) => void;
  variant?: 'public' | 'dashboard';
};


function PdfStatus({ hasPdf }: { hasPdf: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${
        hasPdf
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}
    >
      <FileText size={14} />
      {hasPdf ? 'PDF available' : 'No PDF yet'}
    </span>
  );
}

export function PaperCard({
  paper,
  onOpen,
  onDownload,
  onTagClick,
  variant = 'public',
}: PaperCardProps) {
  const hasPdf = Boolean(paper.pdfPath);
  const ratingText = paper.averageRating > 0 ? paper.averageRating.toFixed(1) : 'No rating';
  const commentCount = paper.totalRatings || 0;
  // show a few lines and allow expanding

  return (
    <article className="rounded-lg border border-border bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{getPaperAuthors(paper)}</p>
        </div>
        <PdfStatus hasPdf={hasPdf} />
      </div>

      <button
        type="button"
        onClick={() => onOpen(paper)}
        className="mb-2 block text-left text-xl font-medium leading-snug text-foreground transition-colors hover:text-primary"
      >
        {paper.title}
      </button>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar size={15} />
          {paper.publishedYear}
        </span>
        <span>{getPaperJournal(paper)}</span>
        <span>Added {formatDisplayDate(paper.createdAt)}</span>
      </div>

      <div className="mb-4">
        <ExpandableText text={paper.abstract} lines={variant === 'dashboard' ? 2 : 4} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {paper.keywords.slice(0, variant === 'dashboard' ? 4 : 5).map((keyword) => (
          <button
            key={keyword}
            type="button"
            onClick={() => onTagClick?.(keyword)}
            disabled={!onTagClick}
            className="rounded-md bg-accent px-2 py-1 text-sm text-accent-foreground transition-colors hover:bg-blue-200 disabled:cursor-default disabled:hover:bg-accent"
          >
            #{keyword}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star size={15} className={paper.averageRating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
            {ratingText}
            {paper.totalRatings > 0 ? ` (${paper.totalRatings})` : ''}
          </span>
          <span className="flex items-center gap-1">
            <Download size={15} />
            {paper.downloadCount} downloads
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={15} />
            {commentCount} comments
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen(paper)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <Eye size={16} />
            View
          </button>
          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(paper)}
              disabled={!hasPdf}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                hasPdf
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'cursor-not-allowed bg-muted text-muted-foreground'
              }`}
            >
              <Download size={16} />
              Download
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
