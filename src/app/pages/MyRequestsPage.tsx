import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Plus, Eye, Calendar, BookOpen } from 'lucide-react';

interface PaperRequest {
  id: string;
  title: string;
  doi: string;
  link: string;
  abstract: string;
  keywords: string[];
  year: string;
  status: 'pending' | 'downloaded' | 'not-downloaded';
  requestedDate: string;
}

const mockRequests: PaperRequest[] = [
  {
    id: '1',
    title: 'Machine Learning Applications in Healthcare: A Systematic Review',
    doi: '10.1234/ml.healthcare.2024',
    link: 'https://example.com/ml-healthcare',
    abstract: 'This systematic review explores the various applications of machine learning in healthcare...',
    keywords: ['machine learning', 'healthcare', 'AI'],
    year: '2024',
    status: 'downloaded',
    requestedDate: '2024-05-15',
  },
  {
    id: '2',
    title: 'Deep Neural Networks for Image Classification',
    doi: '10.1234/dnn.classification.2024',
    link: 'https://example.com/dnn-classification',
    abstract: 'An in-depth study of deep neural network architectures for image classification tasks...',
    keywords: ['deep learning', 'neural networks', 'classification'],
    year: '2024',
    status: 'pending',
    requestedDate: '2024-05-18',
  },
  {
    id: '3',
    title: 'Natural Language Processing in Modern Applications',
    doi: '10.1234/nlp.modern.2024',
    link: 'https://example.com/nlp-modern',
    abstract: 'Exploring modern NLP techniques and their applications in real-world scenarios...',
    keywords: ['NLP', 'language models', 'transformers'],
    year: '2024',
    status: 'not-downloaded',
    requestedDate: '2024-05-10',
  },
  {
    id: '4',
    title: 'Computer Vision Techniques for Object Detection',
    doi: '10.1234/cv.object.2024',
    link: 'https://example.com/cv-object',
    abstract: 'A comprehensive analysis of computer vision methods for object detection...',
    keywords: ['computer vision', 'object detection', 'YOLO'],
    year: '2023',
    status: 'downloaded',
    requestedDate: '2024-05-12',
  },
  {
    id: '5',
    title: 'Reinforcement Learning for Robotics',
    doi: '10.1234/rl.robotics.2024',
    link: 'https://example.com/rl-robotics',
    abstract: 'Applying reinforcement learning algorithms to robotic control systems...',
    keywords: ['reinforcement learning', 'robotics', 'control systems'],
    year: '2023',
    status: 'pending',
    requestedDate: '2024-05-14',
  },
];

export function MyRequestsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [requests] = useState<PaperRequest[]>(mockRequests);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.doi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: requests.length,
    downloaded: requests.filter(r => r.status === 'downloaded').length,
    pending: requests.filter(r => r.status === 'pending').length,
    'not-downloaded': requests.filter(r => r.status === 'not-downloaded').length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="user" />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-foreground mb-2">My Requests</h1>
              <p className="text-muted-foreground">View and manage all your research paper requests</p>
            </div>
            <button
              onClick={() => navigate('/request-paper')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              New Request
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div
              onClick={() => setFilterStatus('all')}
              className={`bg-white rounded-lg p-4 border ${filterStatus === 'all' ? 'border-primary ring-2 ring-primary/20' : 'border-border'} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Total Requests</p>
                  <h3 className="text-foreground">{statusCounts.all}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BookOpen size={20} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setFilterStatus('downloaded')}
              className={`bg-white rounded-lg p-4 border ${filterStatus === 'downloaded' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-border'} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Downloaded</p>
                  <h3 className="text-foreground">{statusCounts.downloaded}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <BookOpen size={20} className="text-green-600" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setFilterStatus('pending')}
              className={`bg-white rounded-lg p-4 border ${filterStatus === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border'} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Pending</p>
                  <h3 className="text-foreground">{statusCounts.pending}</h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <BookOpen size={20} className="text-amber-600" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setFilterStatus('not-downloaded')}
              className={`bg-white rounded-lg p-4 border ${filterStatus === 'not-downloaded' ? 'border-gray-500 ring-2 ring-gray-500/20' : 'border-border'} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Not Downloaded</p>
                  <h3 className="text-foreground">{statusCounts['not-downloaded']}</h3>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <BookOpen size={20} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, DOI, or keywords..."
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg border border-border shadow-sm p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2">{request.title}</h3>
                    <div className="flex items-center gap-4 text-muted-foreground mb-3">
                      <span className="flex items-center gap-2">
                        <Calendar size={16} />
                        {request.requestedDate}
                      </span>
                      <span>•</span>
                      <span>Year: {request.year}</span>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{request.abstract}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {request.keywords.slice(0, 3).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-accent text-accent-foreground rounded border border-border"
                        >
                          {keyword}
                        </span>
                      ))}
                      {request.keywords.length > 3 && (
                        <span className="px-2 py-1 text-muted-foreground">
                          +{request.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">DOI: {request.doi}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3 ml-4">
                    <StatusBadge status={request.status} />
                    <button
                      onClick={() => navigate(`/paper/${request.id}`)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Eye size={18} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
              <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-foreground mb-2">No requests found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You haven\'t submitted any paper requests yet.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => navigate('/request-paper')}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Submit Your First Request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
