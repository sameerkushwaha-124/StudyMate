import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiEdit3, FiTrash2, FiCode, FiImage, FiFileText } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import AdminNavbar from '../components/AdminNavbar';

// Utility function to format statement text
const formatStatementText = (text) => {
  if (!text) return text;

  // Replace text in double quotes with bold formatting
  let formattedText = text.replace(/"([^"]+)"/g, '**$1**');

  // Replace text in parentheses with heading formatting
  formattedText = formattedText.replace(/\(([^)]+)\)/g, '### $1');

  return formattedText;
};

const AdminContentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`/api/content/${id}`);
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await axios.delete(`/api/content/${id}`);
        toast.success('Content deleted successfully');
        navigate('/admin/dashboard');
      } catch (error) {
        console.error('Error deleting content:', error);
        toast.error('Failed to delete content');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="text-gray-600">Loading content...</span>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-4">The requested content could not be found.</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">View Content</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/admin/content/edit/${id}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FiEdit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiTrash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>
              <div className="flex items-center flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  content.category === 'DSA' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {content.category}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {content.subTopic}
                </span>
                {content.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    content.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    content.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {content.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Statement */}
        {content.problemStatement && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-4">
              <FiFileText className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Statement</h2>
            </div>
            <div className="prose max-w-none">
              <div className="text-gray-700 leading-relaxed font-medium text-sm" style={{ lineHeight: '1.7', letterSpacing: '0.015em' }}>
                <ReactMarkdown>{formatStatementText(content.problemStatement)}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Constraints - Hidden for SQL */}
        {content.category !== 'SQL' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-4">
              <FiFileText className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Constraints</h2>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium text-sm" style={{ lineHeight: '1.7', letterSpacing: '0.015em' }}>
                {content.content}
              </p>
            </div>
          </div>
        )}

        {/* Code Example */}
        {content.codeExample && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-4">
              <FiCode className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Code Example</h2>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {content.codeExample}
              </pre>
            </div>
          </div>
        )}

        {/* Solution */}
        {content.solution && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-4">
              <FiFileText className="h-5 w-5 text-orange-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Solution</h2>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm font-medium" style={{
                lineHeight: '1.7',
                letterSpacing: '0.015em'
              }}>
                {content.solution}
              </p>
            </div>
          </div>
        )}

        {/* Images */}
        {content.images && content.images.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <FiImage className="h-5 w-5 text-pink-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Images</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {content.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <img
                    src={image.url || image.path || image}
                    alt={`Content image ${index + 1}`}
                    className="w-full h-56 object-contain cursor-pointer"
                    onClick={() => window.open(image.url || image.path || image, '_blank')}
                  />

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContentView;
