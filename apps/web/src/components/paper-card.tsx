import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateBookmark, useDeleteBookmark } from "@/features/bookmarks";
import { toast } from "sonner";

export interface PaperCardProps {
  id: string;
  title: string;
  authors: string;
  journal: string;
  abstract: string;
  score: string;
  // Optional props
  date?: string;
  doi?: string;
  keywords?: string[];
  isBookmarked?: boolean;
  bookmarkId?: string;
  showBookmark?: boolean;
}

export function PaperCard({
  id,
  title,
  authors,
  journal,
  abstract,
  score,
  date,
  doi,
  keywords = [],
  isBookmarked = false,
  bookmarkId,
  showBookmark = false,
}: PaperCardProps) {
  const navigate = useNavigate();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();

  const isHigh = parseFloat(score) >= 0.8;
  const badgeColors = isHigh
    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
    : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400";

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBookmarked && bookmarkId) {
      deleteBookmark.mutate(
        { id: bookmarkId, targetKind: "paper", targetId: id },
        {
          onSuccess: () => toast.success("Removed from library"),
          onError: () => toast.error("Failed to remove bookmark"),
        }
      );
    } else {
      createBookmark.mutate(
        { targetKind: "paper", targetId: id },
        {
          onSuccess: () => toast.success("Saved to library"),
          onError: () => toast.error("Failed to save bookmark"),
        }
      );
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
      {/* Title & Score */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <Link
          to={`/papers/${id}`}
          className="text-lg font-bold text-blue-900 dark:text-blue-100 leading-tight pr-16 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer block"
        >
          {title}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {showBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full transition-colors ${
                isBookmarked
                  ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={handleBookmarkToggle}
              disabled={createBookmark.isPending || deleteBookmark.isPending}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
          )}

          <div
            className={`flex flex-col items-center justify-center border rounded-lg px-2 py-1 shrink-0 ${badgeColors}`}
            title="AI Relevance Score"
          >
            <span className="font-extrabold text-sm flex items-center leading-none">
              <span className="w-2.5 h-2.5 bg-current opacity-20 rounded-full inline-block mr-1"></span>
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
        <span className="text-slate-700 dark:text-slate-300 font-bold">{authors}</span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span>{journal}</span>
        {date && (
          <>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{date}</span>
          </>
        )}
        {doi && (
          <>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {doi} <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
      </div>

      {/* Abstract */}
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
        {abstract}
      </p>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-xs font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
