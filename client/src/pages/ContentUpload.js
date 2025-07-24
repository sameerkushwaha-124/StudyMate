import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiImage, FiFileText, FiCode, FiSave, FiDatabase } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { useSearch } from '../context/SearchContext';
import CompactDropdown from '../components/CompactDropdown';
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

const ContentUpload = () => {
  const { refreshContent } = useSearch();
  const location = useLocation();

  // Check if this is accessed through admin route
  const isAdminRoute = location.pathname.startsWith('/admin');
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
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [tableQueries, setTableQueries] = useState('');
  const [generatedTableImages, setGeneratedTableImages] = useState([]);
  const [showCustomTopicInput, setShowCustomTopicInput] = useState(false);

  // Function to parse SQL CREATE TABLE queries and generate table previews
  const generateTablePreviews = (queries) => {
    if (!queries.trim()) {
      setGeneratedTableImages([]);
      return;
    }

    const tables = [];
    const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = createTableRegex.exec(queries)) !== null) {
      const tableName = match[1];
      const columnsText = match[2];

      // Parse columns
      const columns = [];
      const columnLines = columnsText.split(',').map(line => line.trim());

      columnLines.forEach(line => {
        if (line && !line.toLowerCase().includes('constraint') && !line.toLowerCase().includes('foreign key')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            const columnName = parts[0];
            const dataType = parts[1];
            const constraints = parts.slice(2).join(' ');
            columns.push({ name: columnName, type: dataType, constraints });
          }
        }
      });

      if (columns.length > 0) {
        tables.push({ name: tableName, columns });
      }
    }

    setGeneratedTableImages(tables);
  };
  const [customTopic, setCustomTopic] = useState('');
  const [dynamicSubTopics, setDynamicSubTopics] = useState({
    'OOP': [],
    'DSA': [],
    'SQL': []
  });

  const { title, category, subTopic, content, codeExample, problemStatement, solution, difficulty, tags } = formData;

  // Predefined subtopics for each category
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
    ],
    'SQL': [
      'Basic Queries', 'SELECT Statements', 'WHERE Clauses', 'ORDER BY & GROUP BY',
      'Joins', 'Inner Joins', 'Outer Joins', 'Self Joins', 'Cross Joins',
      'Subqueries', 'Correlated Subqueries', 'Common Table Expressions (CTE)',
      'Aggregate Functions', 'Window Functions', 'String Functions', 'Date Functions',
      'Indexes', 'Views', 'Stored Procedures', 'Triggers', 'Transactions',
      'Database Design', 'Normalization', 'Performance Optimization'
    ]
  };

  // Get available subtopics based on selected category (predefined + dynamic)
  const getAvailableSubTopics = () => {
    const predefinedTopics = categorySubTopics[category] || [];
    const dynamicTopics = dynamicSubTopics[category] || [];

    // Combine and remove duplicates
    const allTopics = [...predefinedTopics, ...dynamicTopics];
    return [...new Set(allTopics)];
  };

  // Fetch existing topics from database
  const fetchExistingTopics = async () => {
    try {
      const response = await axios.get('/api/content');
      const content = response.data;

      // Extract unique subtopics for each category
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

      const sqlTopics = [...new Set(content
        .filter(item => item.category === 'SQL')
        .map(item => item.subTopic)
        .filter(topic => topic && !categorySubTopics.SQL.includes(topic))
      )];

      setDynamicSubTopics({
        'OOP': oopTopics,
        'DSA': dsaTopics,
        'SQL': sqlTopics
      });
    } catch (error) {
      console.error('Error fetching existing topics:', error);
    }
  };

  // Set initial subtopic when component mounts and fetch existing topics
  useEffect(() => {
    fetchExistingTopics();
  }, []);

  useEffect(() => {
    const availableSubTopics = getAvailableSubTopics();
    if (availableSubTopics.length > 0 && !subTopic) {
      setFormData(prev => ({ ...prev, subTopic: availableSubTopics[0] }));
    }
  }, [dynamicSubTopics]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => {
    const { name, value } = e.target;

    // If category changes, reset subtopic to first available option
    if (name === 'category') {
      const availableSubTopics = categorySubTopics[value] || [];
      setFormData({
        ...formData,
        [name]: value,
        subTopic: availableSubTopics.length > 0 ? availableSubTopics[0] : ''
      });
      setShowCustomTopicInput(false);
      setCustomTopic('');
    } else if (name === 'subTopic') {
      // Handle "Other" option selection
      if (value === 'OTHER') {
        setShowCustomTopicInput(true);
        setFormData({ ...formData, [name]: '' });
      } else {
        setShowCustomTopicInput(false);
        setCustomTopic('');
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCustomTopicChange = (e) => {
    const value = e.target.value;
    setCustomTopic(value);
    setFormData({ ...formData, subTopic: value });
  };

  const handleTableQueriesChange = (e) => {
    const value = e.target.value;
    setTableQueries(value);
    generateTablePreviews(value);
  };

  // Component to render table preview
  const TablePreview = ({ table }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center bg-blue-50 py-2 rounded">
        {table.name}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Column</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Data Type</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Constraints</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((column, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{column.name}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-blue-600">{column.type}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">{column.constraints || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const isTopicDuplicate = (topicName) => {
    const availableTopics = getAvailableSubTopics();
    return availableTopics.some(topic =>
      topic.toLowerCase() === topicName.toLowerCase()
    );
  };

  const onImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    // Create preview URLs
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPreviewImages(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index].url);
    
    setImages(newImages);
    setPreviewImages(newPreviews);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate custom topic if "Other" is selected
    if (showCustomTopicInput) {
      if (!customTopic.trim()) {
        toast.error('Please enter a topic name');
        return;
      }
      if (customTopic.length < 3) {
        toast.error('Topic name must be at least 3 characters long');
        return;
      }
      if (isTopicDuplicate(customTopic)) {
        toast.error('This topic already exists. Please choose a different name.');
        return;
      }
    }

    // Validate SQL table queries if SQL category
    if (category === 'SQL' && !tableQueries.trim()) {
      toast.error('Please enter CREATE TABLE queries for SQL content');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.keys(formData).forEach(key => {
        let value = formData[key];

        // For SQL category, if content is empty, use problemStatement as content
        if (key === 'content' && category === 'SQL' && !value) {
          value = formData.problemStatement || 'SQL Problem';
        }

        formDataToSend.append(key, value);
      });

      // For SQL category, append table queries instead of images
      if (category === 'SQL') {
        formDataToSend.append('tableQueries', tableQueries);
        // Convert table previews to a simple format for storage
        formDataToSend.append('tableData', JSON.stringify(generatedTableImages));
      } else {
        // Append images for non-SQL categories
        images.forEach(image => {
          formDataToSend.append('images', image);
        });
      }

      // Get admin token for the request
      const adminToken = localStorage.getItem('adminToken');
      const headers = {
        'Content-Type': 'multipart/form-data',
      };

      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      await axios.post('/api/content', formDataToSend, {
        headers,
      });

      // Show success message with custom topic info
      if (showCustomTopicInput) {
        toast.success(`Content uploaded successfully! New topic "${customTopic}" created in ${category}.`);

        // Add the new topic to dynamic topics immediately
        setDynamicSubTopics(prev => ({
          ...prev,
          [category]: [...new Set([...prev[category], customTopic])]
        }));
      } else {
        toast.success('Content uploaded successfully!');
      }

      // Refresh search context to include new content
      refreshContent();

      // Refresh existing topics to get the latest from database
      fetchExistingTopics();

      // Reset form
      const initialSubTopic = categorySubTopics.OOP[0]; // Default to first OOP topic
      setFormData({
        title: '',
        category: 'OOP',
        subTopic: initialSubTopic,
        content: '',
        codeExample: '',
        problemStatement: '',
        solution: '',
        difficulty: 'Easy',
        tags: ''
      });
      setImages([]);
      setPreviewImages([]);
      setShowCustomTopicInput(false);
      setCustomTopic('');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show admin navbar if accessed through admin route */}
      {isAdminRoute && <AdminNavbar />}

      <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Study Content</h1>
          <p className="text-gray-600">Add new study materials, problems, and solutions to your collection</p>
        </div>

        {/* Upload Form */}
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FiFileText className="mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={onChange}
                  required
                  className="input-field"
                  placeholder="Enter content title"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={onChange}
                  required
                  className="input-field"
                >
                  <option value="OOP">
                    Object-Oriented Programming ({categorySubTopics.OOP.length + (dynamicSubTopics.OOP?.length || 0)} topics)
                  </option>
                  <option value="DSA">
                    Data Structures & Algorithms ({categorySubTopics.DSA.length + (dynamicSubTopics.DSA?.length || 0)} topics)
                  </option>
                  <option value="SQL">
                    SQL Database ({categorySubTopics.SQL.length + (dynamicSubTopics.SQL?.length || 0)} topics)
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Subtopic options will update based on your category selection
                </p>
              </div>

              <div>
                <label htmlFor="subTopic" className="block text-sm font-medium text-gray-700 mb-2">
                  Subtopic *
                </label>
                <CompactDropdown
                  value={showCustomTopicInput ? 'OTHER' : subTopic}
                  onChange={onChange}
                  options={getAvailableSubTopics()}
                  placeholder="Select a subtopic..."
                  showAddOption={true}
                  addOptionText="➕ Add New Topic"
                  required={true}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose from predefined topics or add a new one
                </p>

                {/* Custom Topic Input */}
                {showCustomTopicInput && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
                    <label htmlFor="customTopic" className="block text-sm font-medium text-blue-900 mb-2">
                      Enter New Topic Name *
                    </label>
                    <input
                      type="text"
                      id="customTopic"
                      value={customTopic}
                      onChange={handleCustomTopicChange}
                      placeholder={`e.g., Advanced ${category === 'OOP' ? 'Design Patterns' : 'Algorithms'}`}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-colors ${
                        customTopic && isTopicDuplicate(customTopic)
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-blue-300 focus:ring-blue-500'
                      }`}
                      required
                    />

                    {/* Validation Messages */}
                    {customTopic && isTopicDuplicate(customTopic) && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        This topic already exists. Please choose a different name.
                      </p>
                    )}

                    {customTopic && !isTopicDuplicate(customTopic) && customTopic.length >= 3 && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <span className="mr-1">✅</span>
                        Good! This will create a new topic in the {category} category.
                      </p>
                    )}

                    {!customTopic && (
                      <p className="text-xs text-blue-600 mt-1">
                        Enter a unique name for your new {category} topic
                      </p>
                    )}
                  </div>
                )}

                {/* Available Topics Preview */}
                {!showCustomTopicInput && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Available {category} Topics ({getAvailableSubTopics().length} total):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {/* Predefined Topics */}
                      {categorySubTopics[category].map((topic) => (
                        <span
                          key={topic}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            topic === subTopic
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {topic}
                        </span>
                      ))}

                      {/* Dynamic Topics */}
                      {dynamicSubTopics[category].map((topic) => (
                        <span
                          key={topic}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            topic === subTopic
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                          title="Custom topic"
                        >
                          {topic} ✨
                        </span>
                      ))}

                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                        + Add New
                      </span>
                    </div>

                    {(dynamicSubTopics[category]?.length || 0) > 0 && (
                      <p className="text-xs text-purple-600 mt-2">
                        ✨ = Custom topics you've created
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={difficulty}
                  onChange={onChange}
                  className="input-field"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={tags}
                onChange={onChange}
                className="input-field"
                placeholder="e.g., inheritance, polymorphism, sorting"
              />
            </div>

            {/* Compiler Settings - Only for DSA/OOP, not SQL */}
            {category !== 'SQL' && (
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
            )}
          </div>

          {/* SQL-specific form structure */}
          {category === 'SQL' ? (
            <>
              {/* Database Tables & Schema (Query Input) for SQL */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiDatabase className="mr-2" />
                  Database Tables & Schema *
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="tableQueries" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter CREATE TABLE Queries
                    </label>
                    <textarea
                      id="tableQueries"
                      value={tableQueries}
                      onChange={handleTableQueriesChange}
                      rows={8}
                      className="input-field font-mono text-sm leading-relaxed"
                      placeholder="Enter CREATE TABLE statements here...

Example:
CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    salary DECIMAL(10,2),
    department_id INT,
    hire_date DATE
);

CREATE TABLE departments (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    location VARCHAR(100)
);"
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        lineHeight: '1.6',
                        letterSpacing: '0.025em',
                        fontSize: '14px'
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Enter CREATE TABLE statements and see live table previews below
                    </p>
                  </div>

                  {/* Table Previews */}
                  {generatedTableImages.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Table Previews:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedTableImages.map((table, index) => (
                          <TablePreview key={index} table={table} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statement for SQL */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiFileText className="mr-2" />
                  Statement *
                </h2>

                <div>
                  <textarea
                    id="problemStatement"
                    name="problemStatement"
                    value={problemStatement}
                    onChange={onChange}
                    required
                    rows={6}
                    className="input-field text-sm leading-relaxed font-medium"
                    placeholder="Describe the database problem, query requirements, or scenario..."
                    style={{
                      lineHeight: '1.7',
                      letterSpacing: '0.015em'
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Explain what needs to be queried, calculated, or retrieved from the database
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    ✨ Formatting tips: Use "text" for <strong>bold</strong> and (text) for headings
                  </p>

                  {/* Preview Section */}
                  {problemStatement && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-900 mb-2">Preview:</h4>
                      <div className="prose prose-sm max-w-none text-sm">
                        <ReactMarkdown>{formatStatementText(problemStatement)}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Code Example for SQL */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiCode className="mr-2" />
                  Code Example *
                </h2>

                <div>
                  <textarea
                    id="codeExample"
                    name="codeExample"
                    value={codeExample}
                    onChange={onChange}
                    required
                    rows={8}
                    className="input-field font-mono text-sm leading-relaxed"
                    placeholder="Enter SQL queries, stored procedures, or database code examples..."
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      lineHeight: '1.6',
                      letterSpacing: '0.025em',
                      fontSize: '14px'
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Enter SQL queries with proper formatting and indentation
                  </p>
                </div>
              </div>

              {/* Solution for SQL */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiCode className="mr-2" />
                  Solution (Optional)
                </h2>

                <div>
                  <textarea
                    id="solution"
                    name="solution"
                    value={solution}
                    onChange={onChange}
                    rows={6}
                    className="input-field text-sm leading-relaxed font-medium"
                    placeholder="Enter solution explanation or additional notes..."
                    style={{
                      lineHeight: '1.7',
                      letterSpacing: '0.015em'
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Explain the solution approach or provide additional context
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Non-SQL form structure (DSA/OOP) */}
              {/* Statement */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiFileText className="mr-2" />
                  Statement (Optional)
                </h2>

                <div>
                  <textarea
                    id="problemStatement"
                    name="problemStatement"
                    value={problemStatement}
                    onChange={onChange}
                    rows={6}
                    className="input-field text-sm leading-relaxed font-medium"
                    placeholder="Describe the problem or question (supports Markdown)"
                    style={{
                      lineHeight: '1.7',
                      letterSpacing: '0.015em'
                    }}
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    ✨ Formatting tips: Use "text" for <strong>bold</strong> and (text) for headings
                  </p>

                  {/* Preview Section */}
                  {problemStatement && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-900 mb-2">Preview:</h4>
                      <div className="prose prose-sm max-w-none text-sm">
                        <ReactMarkdown>{formatStatementText(problemStatement)}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Constraints */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiFileText className="mr-2" />
                  Constraints *
                </h2>

                <div>
                  <textarea
                    id="content"
                    name="content"
                    value={content}
                    onChange={onChange}
                    required
                    rows={10}
                    className="input-field text-sm leading-relaxed font-medium"
                    placeholder="Enter problem constraints and limitations (preserves formatting and line breaks)"
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.7',
                      letterSpacing: '0.015em'
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Tip: Include input/output constraints, time/space complexity limits, and any problem-specific restrictions
                  </p>
                </div>
              </div>

              {/* Code Example */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiCode className="mr-2" />
                  Code Example (Optional)
                </h2>

                <div>
                  <textarea
                    id="codeExample"
                    name="codeExample"
                    value={codeExample}
                    onChange={onChange}
                    rows={8}
                    className="input-field font-mono text-sm leading-relaxed"
                    placeholder="Enter code example"
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      lineHeight: '1.6',
                      letterSpacing: '0.025em',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Solution */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiCode className="mr-2" />
                  Solution (Optional)
                </h2>

                <div>
                  <textarea
                    id="solution"
                    name="solution"
                    value={solution}
                    onChange={onChange}
                    rows={8}
                    className="input-field text-sm leading-relaxed font-medium"
                    placeholder="Enter solution explanation (supports Markdown)"
                    style={{
                      lineHeight: '1.7',
                      letterSpacing: '0.015em'
                    }}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FiImage className="mr-2" />
                  Images (Optional)
                </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Max 5 files, 5MB each)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FiUpload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={onImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200">
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 truncate text-center font-medium">{preview.name}</p>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                const initialSubTopic = categorySubTopics.OOP[0];
                setFormData({
                  title: '',
                  category: 'OOP',
                  subTopic: initialSubTopic,
                  content: '',
                  codeExample: '',
                  problemStatement: '',
                  solution: '',
                  difficulty: 'Easy',
                  tags: ''
                });
                setImages([]);
                setPreviewImages([]);
                setShowCustomTopicInput(false);
                setCustomTopic('');
              }}
              className="btn-secondary"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4" />
                  <span>Save Content</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default ContentUpload;
