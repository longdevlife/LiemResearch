import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { UploadPdfModal } from '../components/UploadPdfModal';
import { Search, Download, Eye, Calendar, Filter, Upload, Star } from 'lucide-react';

interface AvailablePaper {
  id: string;
  title: string;
  doi: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  year: string;
  journal: string;
  downloadCount: number;
  addedDate: string;
  hasPdf: boolean;
  rating: number;
  ratingCount: number;
}

const mockAvailablePapers: AvailablePaper[] = [
  {
    id: '1',
    title: 'Machine Learning Applications in Healthcare: A Systematic Review',
    doi: '10.1234/ml.healthcare.2024',
    authors: ['John Smith', 'Jane Doe', 'Robert Brown'],
    abstract: 'This systematic review explores the various applications of machine learning in healthcare, including diagnostic systems, treatment planning, and patient monitoring. The study analyzes 150 research papers published between 2020 and 2024.',
    keywords: ['machine learning', 'healthcare', 'artificial intelligence', 'medical diagnosis'],
    year: '2024',
    journal: 'Journal of Medical AI',
    downloadCount: 145,
    addedDate: '2024-05-15',
    hasPdf: true,
    rating: 4.5,
    ratingCount: 23,
  },
  {
    id: '2',
    title: 'Deep Neural Networks for Image Classification',
    doi: '10.1234/dnn.classification.2024',
    authors: ['Alice Johnson', 'Mark Wilson'],
    abstract: 'An in-depth study of deep neural network architectures for image classification tasks, comparing CNN, ResNet, and Vision Transformer models across multiple datasets.',
    keywords: ['deep learning', 'neural networks', 'classification', 'computer vision'],
    year: '2024',
    journal: 'Computer Vision Research',
    downloadCount: 98,
    addedDate: '2024-05-10',
    hasPdf: false,
    rating: 0,
    ratingCount: 0,
  },
  {
    id: '3',
    title: 'Natural Language Processing in Modern Applications',
    doi: '10.1234/nlp.modern.2024',
    authors: ['Sarah Chen', 'David Lee', 'Emily White'],
    abstract: 'Exploring modern NLP techniques and their applications in real-world scenarios, including sentiment analysis, machine translation, and question answering systems.',
    keywords: ['NLP', 'language models', 'transformers', 'BERT'],
    year: '2024',
    journal: 'Computational Linguistics',
    downloadCount: 167,
    addedDate: '2024-05-08',
    hasPdf: true,
    rating: 4.8,
    ratingCount: 45,
  },
  {
    id: '4',
    title: 'Computer Vision Techniques for Object Detection',
    doi: '10.1234/cv.object.2024',
    authors: ['Michael Zhang', 'Lisa Anderson'],
    abstract: 'A comprehensive analysis of computer vision methods for object detection, including YOLO, Faster R-CNN, and EfficientDet architectures.',
    keywords: ['computer vision', 'object detection', 'YOLO', 'deep learning'],
    year: '2023',
    journal: 'Vision and Pattern Recognition',
    downloadCount: 203,
    addedDate: '2024-05-05',
    hasPdf: true,
    rating: 4.2,
    ratingCount: 18,
  },
  {
    id: '5',
    title: 'Reinforcement Learning for Robotics',
    doi: '10.1234/rl.robotics.2024',
    authors: ['James Taylor', 'Anna Martinez'],
    abstract: 'Applying reinforcement learning algorithms to robotic control systems, demonstrating improved performance in navigation and manipulation tasks.',
    keywords: ['reinforcement learning', 'robotics', 'control systems', 'Q-learning'],
    year: '2023',
    journal: 'Robotics and Automation',
    downloadCount: 89,
    addedDate: '2024-05-01',
    hasPdf: false,
    rating: 0,
    ratingCount: 0,
  },
  {
    id: '6',
    title: 'Blockchain Technology in Supply Chain Management',
    doi: '10.1234/blockchain.supply.2024',
    authors: ['Kevin Brown', 'Patricia Garcia'],
    abstract: 'Investigating the implementation of blockchain technology in supply chain management systems for improved transparency and traceability.',
    keywords: ['blockchain', 'supply chain', 'distributed ledger', 'smart contracts'],
    year: '2024',
    journal: 'Technology and Innovation',
    downloadCount: 76,
    addedDate: '2024-04-28',
    hasPdf: true,
    rating: 3.9,
    ratingCount: 12,
  },
];

export function SearchPapersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [papers, setPapers] = useState<AvailablePaper[]>(mockAvailablePapers);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<AvailablePaper | null>(null);

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch = searchTerm === '' ||
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.doi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      paper.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())) ||
      paper.journal.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = yearFilter === 'all' || paper.year === yearFilter;

    return matchesSearch && matchesYear;
  });

  const years = Array.from(new Set(papers.map(p => p.year))).sort((a, b) => b.localeCompare(a));

  const handleOpenUploadModal = (paper: AvailablePaper) => {
    setSelectedPaper(paper);
    setUploadModalOpen(true);
  };

  const handleUploadPdf = (file: File) => {
    if (selectedPaper) {
      setPapers(papers.map(paper =>
        paper.id === selectedPaper.id ? { ...paper, hasPdf: true } : paper
      ));
      alert(`PDF "${file.name}" uploaded successfully!`);
    }
  };

  const renderStars = (rating: number, ratingCount: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span className="text-muted-foreground ml-1">
          {rating > 0 ? `${rating.toFixed(1)} (${ratingCount})` : 'No ratings'}
        </span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="user" />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-foreground mb-2">Search Papers</h1>
            <p className="text-muted-foreground">Browse and download research papers available in the system</p>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-sm p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, author, DOI, keywords, or journal..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background appearance-none"
                >
                  <option value="all">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4 text-muted-foreground">
            Found {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''}
          </div>

          <div className="space-y-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-lg border border-border shadow-sm p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2">{paper.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <span>{paper.authors.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {paper.year}
                      </span>
                      <span>•</span>
                      <span>{paper.journal}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Download size={16} />
                        {paper.downloadCount} downloads
                      </span>
                    </div>
                    <div className="mb-3">
                      {renderStars(paper.rating, paper.ratingCount)}
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{paper.abstract}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {paper.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-accent text-accent-foreground rounded border border-border"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <p className="text-muted-foreground">DOI: {paper.doi}</p>
                  </div>
                  <div className="flex flex-col gap-3 ml-4">
                    <button
                      onClick={() => navigate(`/paper/${paper.id}`)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Eye size={18} />
                      View
                    </button>
                    {paper.hasPdf ? (
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download size={18} />
                        Download
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenUploadModal(paper)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Upload size={18} />
                        Upload PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPapers.length === 0 && (
            <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
              <Search size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-foreground mb-2">No papers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
        </div>

        <UploadPdfModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUploadPdf}
          paperTitle={selectedPaper?.title || ''}
        />
      </div>
    </div>
  );
}
