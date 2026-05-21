import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '../lib/api';

export function RequestPaperPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    doi: '',
    link: '',
    abstract: '',
    keywords: '',
    year: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await apiRequest('/papers', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          title: formData.title,
          doi: formData.doi,
          paperLink: formData.link,
          abstract: formData.abstract,
          keywords: formData.keywords,
          publishedYear: Number(formData.year),
        }),
      });

      setMessage('Paper request submitted successfully.');
      setTimeout(() => navigate('/my-requests'), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit paper request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormInvalid = !formData.title || !formData.doi || !formData.link || !formData.abstract || !formData.year;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="user" />

      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <div className="mb-8">
            <h1 className="text-foreground mb-2">Request Research Paper</h1>
            <p className="text-muted-foreground">Fill in the details of the paper you need</p>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-foreground mb-2">Paper Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="Enter the full title of the research paper"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground mb-2">DOI *</label>
                  <input
                    type="text"
                    name="doi"
                    value={formData.doi}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    placeholder="10.1234/example.2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground mb-2">Publication Year *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    placeholder="2024"
                    min="1900"
                    max="2099"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground mb-2">Paper Link *</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="Paste the paper source URL"
                  required
                />
              </div>

              <div>
                <label className="block text-foreground mb-2">Abstract *</label>
                <textarea
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background resize-none"
                  placeholder="Paste or enter the paper abstract..."
                  required
                />
              </div>

              <div>
                <label className="block text-foreground mb-2">Keywords</label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  placeholder="machine learning, neural networks, classification"
                />
                <p className="text-muted-foreground mt-2">Separate keywords with commas</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || isFormInvalid}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
