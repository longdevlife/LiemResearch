import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type EditablePaper = {
  _id: string;
  title: string;
  doi: string;
  paperLink: string;
  abstract: string;
  keywords: string[];
  publishedYear: number;
  status: 'pending' | 'downloaded' | 'not-downloaded' | 'approved' | 'rejected';
};

interface EditPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paper: EditablePaper) => void;
  paper: EditablePaper | null;
}

export function EditPaperModal({ isOpen, onClose, onSave, paper }: EditPaperModalProps) {
  const [editedPaper, setEditedPaper] = useState<EditablePaper | null>(paper);
  const [keywordsText, setKeywordsText] = useState('');

  useEffect(() => {
    setEditedPaper(paper);
    setKeywordsText(paper?.keywords.join(', ') || '');
  }, [paper]);

  if (!isOpen || !paper || !editedPaper) return null;

  const handleSave = () => {
    onSave({
      ...editedPaper,
      keywords: keywordsText.split(',').map((keyword) => keyword.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-foreground">Edit Paper Information</h2>
            <p className="text-muted-foreground mt-1">Update paper details and request status</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-foreground mb-2">Paper Title *</label>
            <input
              type="text"
              value={editedPaper.title}
              onChange={(e) => setEditedPaper({ ...editedPaper, title: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
            />
          </div>

          <div>
            <label className="block text-foreground mb-2">DOI *</label>
            <input
              type="text"
              value={editedPaper.doi}
              onChange={(e) => setEditedPaper({ ...editedPaper, doi: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              placeholder="10.1234/example.2024"
            />
          </div>

          <div>
            <label className="block text-foreground mb-2">Paper Link *</label>
            <input
              type="url"
              value={editedPaper.paperLink}
              onChange={(e) => setEditedPaper({ ...editedPaper, paperLink: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              placeholder="https://example.com/paper"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground mb-2">Publication Year *</label>
              <input
                type="number"
                value={editedPaper.publishedYear}
                min="1900"
                max="2100"
                onChange={(e) => setEditedPaper({ ...editedPaper, publishedYear: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              />
            </div>

            <div>
              <label className="block text-foreground mb-2">Status</label>
              <select
                value={editedPaper.status}
                onChange={(e) => setEditedPaper({ ...editedPaper, status: e.target.value as EditablePaper['status'] })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="downloaded">Downloaded</option>
                <option value="not-downloaded">Not Downloaded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-foreground mb-2">Abstract *</label>
            <textarea
              value={editedPaper.abstract}
              onChange={(e) => setEditedPaper({ ...editedPaper, abstract: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background resize-none"
            />
          </div>

          <div>
            <label className="block text-foreground mb-2">Keywords</label>
            <input
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              placeholder="machine learning, neural networks, classification"
            />
            <p className="text-muted-foreground mt-2">Separate keywords with commas</p>
          </div>
        </div>

        <div className="flex gap-4 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
