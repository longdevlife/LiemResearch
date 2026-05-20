import { useState } from 'react';
import { X } from 'lucide-react';

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

interface EditPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paper: Paper) => void;
  paper: Paper | null;
}

export function EditPaperModal({ isOpen, onClose, onSave, paper }: EditPaperModalProps) {
  const [editedPaper, setEditedPaper] = useState<Paper | null>(paper);

  if (!isOpen || !paper || !editedPaper) return null;

  const handleSave = () => {
    onSave(editedPaper);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-foreground">Edit Paper Information</h2>
            <p className="text-muted-foreground mt-1">Correct inaccurate or invalid paper details</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground mb-2">Requested By</label>
              <input
                type="text"
                value={editedPaper.requestedBy}
                onChange={(e) => setEditedPaper({ ...editedPaper, requestedBy: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              />
            </div>

            <div>
              <label className="block text-foreground mb-2">Student ID</label>
              <input
                type="text"
                value={editedPaper.studentId}
                onChange={(e) => setEditedPaper({ ...editedPaper, studentId: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-foreground mb-2">University</label>
            <input
              type="text"
              value={editedPaper.university}
              onChange={(e) => setEditedPaper({ ...editedPaper, university: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
            />
          </div>

          <div>
            <label className="block text-foreground mb-2">Request Date</label>
            <input
              type="date"
              value={editedPaper.requestDate}
              onChange={(e) => setEditedPaper({ ...editedPaper, requestDate: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800">
              ⚠️ Make sure all information is accurate before saving. This will update the paper details in the system.
            </p>
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
