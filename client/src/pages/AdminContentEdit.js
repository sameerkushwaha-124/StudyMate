import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiSave, FiArrowLeft, FiX, FiImage, FiTrash2 } from 'react-icons/fi';
import CompactDropdown from '../components/CompactDropdown';
import AdminNavbar from '../components/AdminNavbar';
import { useAdmin } from '../context/AdminContext';

const AdminContentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdminAuthenticated } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'OOP',
    subTopic: '',
    content: '',
    codeExample: '',
    problemStatement: '',
    solution: '',
    difficulty: 'Easy',
    tags: '',
    enableCompiler: true
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [dynamicSubTopics, setDynamicSubTopics] = useState({
    'OOP': [],
    'DSA': []
  });

  // Predefined subtopics
  const categorySubTopics = {
    'OOP': [
      'Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 
      'Abstraction', 'Design Patterns', 'SOLID Principles', 'Constructors', 
      'Access Modifiers', 'Method Overriding', 'Method Overloading', 
      'Static Members', 'Abstract Classes', 'Interfaces'
    ],
    'DSA': [
      'Arrays', 'Strings', 'Two Pointers', 'Sliding Window', 'Greedy', 
      'Linked List', 'Stack', 'Queue', 'Heap', 'Hashing', 
      'Tree', 'Graph', 'Dynamic Programming', 'Backtracking', 
      'Binary Search', 'Sorting', 'Math', 'Bit Manipulation'
    ]
  };

  const getAvailableSubTopics = () => {
    const predefinedTopics = categorySubTopics[formData.category] || [];
    const dynamicTopics = dynamicSubTopics[formData.category] || [];
    const allTopics = [...predefinedTopics, ...dynamicTopics];
    return [...new Set(allTopics)];
  };

  useEffect(() => {
    fetchContent();
    fetchExistingTopics();
  }, [id]);

  const fetchContent = async () => {
    try {
      // Get admin token for the request
      const adminToken = localStorage.getItem('adminToken');
      const headers = adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {};

      const response = await axios.get(`/api/content/${id}`, { headers });
      const data = response.data;
      
      setFormData({
        title: data.title || '',
        category: data.category || 'OOP',
        subTopic: data.subTopic || '',
        content: data.content || '',
        codeExample: data.codeExample || '',
        problemStatement: data.problemStatement || '',
        solution: data.solution || '',
        difficulty: data.difficulty || 'Easy',
        tags: data.tags ? data.tags.join(', ') : '',
        enableCompiler: data.enableCompiler !== undefined ? data.enableCompiler : true
      });
      
      // Extract image URLs from the image objects
      const imageUrls = (data.images || []).map(image => {
        if (typeof image === 'string') {
          return image;
        }
        // For Cloudinary images, use the secure URL
        return image.url || image.path || image.cloudinaryData?.secure_url || `/uploads/${image.filename}`;
      });

      setExistingImages(imageUrls);
      console.log('Loaded existing images:', imageUrls);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingTopics = async () => {
    try {
      const response = await axios.get('/api/content');
      const content = response.data;
      
      const oopTopics = [...new Set(content
        .filter(item => item.category === 'OOP')
        .map(item => item.subTopic)
        .filter(topic => topic && !categorySubTopics.OOP.includes(topic))
      )];
      
      const dsaTopics = [...new Set(content
        .filter(item => item.category === 'DSA')
        .map(item => item.subTopic)
        .filter(topic => topic && !categorySubTopics.DSA.includes(topic))
      )];
      
      setDynamicSubTopics({
        'OOP': oopTopics,
        'DSA': dsaTopics
      });
    } catch (error) {
      console.error('Error fetching existing topics:', error);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      const availableSubTopics = categorySubTopics[value] || [];
      setFormData({ 
        ...formData, 
        [name]: value,
        subTopic: availableSubTopics.length > 0 ? availableSubTopics[0] : ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const removeExistingImage = (imageUrl) => {
    const isMarkedForDeletion = deletedImages.includes(imageUrl);

    if (isMarkedForDeletion) {
      // Restore the image (remove from deleted list)
      setDeletedImages(deletedImages.filter(img => img !== imageUrl));
      alert('Image restored. It will be kept when you save the content.');
    } else {
      // Mark for deletion
      const confirmDelete = window.confirm(
        'Are you sure you want to delete this image? This action cannot be undone.'
      );

      if (confirmDelete) {
        // Add to deleted images list for backend processing
        setDeletedImages([...deletedImages, imageUrl]);

        // Show success message
        alert('Image marked for deletion. Click the button again to restore, or save to permanently delete.');
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!isAdminAuthenticated) {
      toast.error('Admin authentication required');
      navigate('/admin/login');
      return;
    }

    setSaving(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append new images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      // Append existing images to keep (send URLs only)
      formDataToSend.append('existingImages', JSON.stringify(existingImages));

      // Append deleted images for backend processing (send URLs only)
      formDataToSend.append('deletedImages', JSON.stringify(deletedImages));

      console.log('Sending update request for content ID:', id);
      console.log('Form data keys:', Array.from(formDataToSend.keys()));
      console.log('Existing images being sent:', existingImages);
      console.log('Deleted images being sent:', deletedImages);

      // Get admin token from localStorage
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }

      const response = await axios.put(`/api/content/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      console.log('Update response:', response.data);

      // Show specific success message based on what was updated
      let successMessage = 'Content updated successfully!';
      if (deletedImages.length > 0) {
        successMessage += ` ${deletedImages.length} image(s) deleted.`;
      }
      if (images.length > 0) {
        successMessage += ` ${images.length} new image(s) added.`;
      }

      toast.success(successMessage);

      // Reset states
      setDeletedImages([]);
      setImages([]);
      setPreviewImages([]);

      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error updating content:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      const errorMessage = error.response?.data?.message || 'Failed to update content';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="text-gray-600">Loading content...</span>
          </div>
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
              <h1 className="text-xl font-semibold text-gray-900">Edit Content</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  required
                  className="input-field"
                  placeholder="Enter content title"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={onChange}
                  required
                  className="input-field"
                >
                  <option value="OOP">Object-Oriented Programming</option>
                  <option value="DSA">Data Structures & Algorithms</option>
                </select>
              </div>

              {/* Subtopic */}
              <div>
                <label htmlFor="subTopic" className="block text-sm font-medium text-gray-700 mb-2">
                  Subtopic *
                </label>
                <CompactDropdown
                  value={formData.subTopic}
                  onChange={onChange}
                  options={getAvailableSubTopics()}
                  placeholder="Select a subtopic..."
                  showAddOption={false}
                  required={true}
                />
              </div>

              {/* Difficulty */}
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={onChange}
                  className="input-field"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={onChange}
                  className="input-field"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            {/* Compiler Settings */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableCompiler"
                  name="enableCompiler"
                  checked={formData.enableCompiler}
                  onChange={(e) => setFormData({ ...formData, enableCompiler: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableCompiler" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable Interactive Java Compiler
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                When enabled, Java code examples will be interactive and executable by users
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Content</h2>
            
            <div className="space-y-6">
              {/* Problem Statement */}
              <div>
                <label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Statement
                </label>
                <textarea
                  id="problemStatement"
                  name="problemStatement"
                  value={formData.problemStatement}
                  onChange={onChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe the problem or concept..."
                />
              </div>

              {/* Main Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Main Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={onChange}
                  required
                  rows={6}
                  className="input-field font-mono"
                  placeholder="Enter the main content (preserves formatting)..."
                  style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                />
                <p className="text-sm text-gray-500 mt-2">
                  💡 Preserves exact formatting, line breaks, and spacing
                </p>
              </div>

              {/* Code Example */}
              <div>
                <label htmlFor="codeExample" className="block text-sm font-medium text-gray-700 mb-2">
                  Code Example
                </label>
                <textarea
                  id="codeExample"
                  name="codeExample"
                  value={formData.codeExample}
                  onChange={onChange}
                  rows={8}
                  className="input-field font-mono text-sm"
                  placeholder="// Enter code example here..."
                />
              </div>

              {/* Solution */}
              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">
                  Solution/Explanation
                </label>
                <textarea
                  id="solution"
                  name="solution"
                  value={formData.solution}
                  onChange={onChange}
                  rows={6}
                  className="input-field"
                  placeholder="Provide solution or detailed explanation..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Images</h2>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Current Images</h3>
                  {deletedImages.length > 0 && (
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                      {deletedImages.length} marked for deletion
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {existingImages.map((image, index) => {
                    const isMarkedForDeletion = deletedImages.includes(image);
                    return (
                      <div key={index} className="relative group">
                        <div className={`relative overflow-hidden rounded-xl border-2 bg-white shadow-sm hover:shadow-lg transition-all duration-200 ${
                          isMarkedForDeletion
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        }`}>
                          <img
                            src={image}
                            alt={`Existing ${index + 1}`}
                            className={`w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200 ${
                              isMarkedForDeletion ? 'opacity-50 grayscale' : ''
                            }`}
                          />
                          <div className={`absolute inset-0 transition-colors duration-200 ${
                            isMarkedForDeletion
                              ? 'bg-red-500/30'
                              : 'bg-black/0 group-hover:bg-black/20'
                          }`}></div>

                          {isMarkedForDeletion && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                Marked for Deletion
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => removeExistingImage(image)}
                            className={`absolute -top-2 -right-2 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 ${
                              isMarkedForDeletion
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-red-500 hover:bg-red-600'
                            }`}
                            title={isMarkedForDeletion ? "Restore this image" : "Delete this image"}
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Images */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                Add New Images
              </label>
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="input-field"
              />
              
              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                <div className="flex items-center">
                  <FiSave className="h-4 w-4 mr-2" />
                  Update Content
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminContentEdit;
