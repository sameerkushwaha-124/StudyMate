import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiChevronLeft, FiChevronRight, FiCode, FiImage, FiFileText, FiSearch, FiPlay, FiX, FiCheck } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-toastify';
import '../styles/StudyContent.css';

const StudyContent = () => {
  const { category } = useParams();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subTopics, setSubTopics] = useState([]);
  const [selectedSubTopic, setSelectedSubTopic] = useState('');
  const [content, setContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubTopics, setExpandedSubTopics] = useState(new Set());
  const [topicSearchResults, setTopicSearchResults] = useState([]);
  const [dynamicSubTopics, setDynamicSubTopics] = useState([]);
  const [contentProgress, setContentProgress] = useState({});

  const categoryTitle = category === 'oop' ? 'Object-Oriented Programming' : 'Data Structures & Algorithms';
  const categoryKey = category === 'oop' ? 'OOP' : 'DSA';

  // Default subtopics for DSA and OOP
  const defaultSubTopics = {
    'DSA': [
      'Arrays', 'Strings', 'Two Pointers', 'Sliding Window', 'Greedy',
      'Linked List', 'Stack', 'Queue', 'Heap', 'Hashing',
      'Tree', 'Graph', 'Dynamic Programming', 'Backtracking',
      'Binary Search', 'Sorting', 'Math', 'Bit Manipulation'
    ],
    'OOP': [
      'Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation',
      'Abstraction', 'Design Patterns', 'SOLID Principles', 'Constructors',
      'Access Modifiers', 'Method Overriding', 'Method Overloading',
      'Static Members', 'Abstract Classes', 'Interfaces'
    ]
  };

  useEffect(() => {
    fetchAllContent();
    fetchContentProgress();
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initializeSubTopics();
  }, [dynamicSubTopics, category]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle navigation from global search
  useEffect(() => {
    if (location.state?.selectedContent && location.state?.selectedSubTopic) {
      const { selectedContent: navContent, selectedSubTopic: navSubTopic } = location.state;
      setSelectedSubTopic(navSubTopic);
      setSelectedContent(navContent);
      setExpandedSubTopics(new Set([navSubTopic]));

      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const initializeSubTopics = () => {
    const predefinedTopics = defaultSubTopics[categoryKey] || [];
    const allTopics = [...predefinedTopics, ...dynamicSubTopics];
    const uniqueTopics = [...new Set(allTopics)];

    setSubTopics(uniqueTopics);
    if (uniqueTopics.length > 0) {
      setSelectedSubTopic(uniqueTopics[0]);
      setExpandedSubTopics(new Set([uniqueTopics[0]]));
    }
    setLoading(false);
  };

  const fetchAllContent = async () => {
    try {
      const response = await axios.get(`/api/content?category=${categoryKey}`);
      const contentData = response.data;
      setContent(contentData);

      // Extract dynamic subtopics from content
      const existingTopics = [...new Set(contentData
        .map(item => item.subTopic)
        .filter(topic => topic && !defaultSubTopics[categoryKey].includes(topic))
      )];

      setDynamicSubTopics(existingTopics);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const toggleSubTopic = (subTopic) => {
    const newExpanded = new Set(expandedSubTopics);
    if (newExpanded.has(subTopic)) {
      newExpanded.delete(subTopic);
    } else {
      newExpanded.add(subTopic);
    }
    setExpandedSubTopics(newExpanded);
    setSelectedSubTopic(subTopic);
  };

  const getContentForSubTopic = (subTopic) => {
    return content.filter(item => item.subTopic === subTopic);
  };

  const selectContent = (contentItem) => {
    setSelectedContent(contentItem);
    // Record access for activity tracking
    if (contentItem && contentItem._id) {
      recordContentAccess(contentItem._id);
    }
    // Automatically select the subtopic that this content belongs to
    if (contentItem && contentItem.subTopic && contentItem.subTopic !== selectedSubTopic) {
      setSelectedSubTopic(contentItem.subTopic);
      // Expand the subtopic in the sidebar
      setExpandedSubTopics(prev => new Set([...prev, contentItem.subTopic]));
    }
  };

  const performTopicSearch = (query) => {
    setSearchTerm(query);

    if (!query.trim()) {
      setTopicSearchResults([]);
      return;
    }

    // Search across ALL content in the category, not just the selected subtopic
    const results = content.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const contentMatch = item.content.toLowerCase().includes(query.toLowerCase());
      const problemStatementMatch = item.problemStatement?.toLowerCase().includes(query.toLowerCase());
      const solutionMatch = item.solution?.toLowerCase().includes(query.toLowerCase());
      const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      return titleMatch || contentMatch || problemStatementMatch || solutionMatch || tagsMatch;
    });

    setTopicSearchResults(results);
  };

  const clearTopicSearch = () => {
    setSearchTerm('');
    setTopicSearchResults([]);
  };

  const fetchContentProgress = async () => {
    try {
      const response = await axios.get(`/api/progress/content/${categoryKey}`);
      const progressMap = {};
      response.data.forEach(item => {
        progressMap[item._id] = item.completed;
      });
      setContentProgress(progressMap);
    } catch (error) {
      console.error('Error fetching content progress:', error);
    }
  };

  const toggleContentProgress = async (contentId) => {
    try {
      const response = await axios.post('/api/progress/toggle', { contentId });

      // Update local state
      setContentProgress(prev => ({
        ...prev,
        [contentId]: response.data.completed
      }));

      // Record access for activity tracking
      await axios.post('/api/progress/access', { contentId });

      toast.success(response.data.completed ? 'Problem marked as completed!' : 'Problem marked as incomplete');
    } catch (error) {
      console.error('Error toggling progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const recordContentAccess = async (contentId) => {
    try {
      await axios.post('/api/progress/access', { contentId });
    } catch (error) {
      console.error('Error recording access:', error);
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const filteredContent = searchTerm
    ? topicSearchResults
    : getContentForSubTopic(selectedSubTopic);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[623.5px] bg-gray-50 flex overflow-hidden max-h-screen">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-12'} transition-all duration-300 bg-white shadow-sm border-r border-gray-200 flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="min-w-0 flex-1 mr-1">
                <h2 className="text-sm font-medium text-gray-900 truncate">{categoryTitle}</h2>
                <p className="text-xs text-gray-500">Select topic</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {sidebarOpen ? <FiChevronLeft className="h-3.5 w-3.5" /> : <FiChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Subtopics and Problems List */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-2 sidebar-scroll">
            <div className="space-y-1">
              {searchTerm ? (
                // Show search results
                <div className="space-y-1">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-900 text-sm mb-2">
                      Search Results ({topicSearchResults.length})
                    </h4>
                    {topicSearchResults.length > 0 ? (
                      <div className="space-y-1">
                        {topicSearchResults.map((item) => (
                          <button
                            key={item._id}
                            onClick={() => selectContent(item)}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center space-x-3 group ${
                              selectedContent?._id === item._id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                                : 'hover:bg-blue-50 text-gray-700 hover:shadow-sm hover:transform hover:scale-102'
                            }`}
                          >
                            <FiPlay className={`h-3 w-3 flex-shrink-0 ${
                              selectedContent?._id === item._id ? 'text-white' : 'text-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${
                                selectedContent?._id === item._id ? 'text-white' : 'text-gray-900'
                              }`}>
                                {highlightText(item.title, searchTerm)}
                              </p>
                              <p className={`text-xs truncate ${
                                selectedContent?._id === item._id ? 'text-white/80' : 'text-gray-500'
                              }`}>
                                {item.subTopic}
                              </p>
                              {item.difficulty && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  selectedContent?._id === item._id
                                    ? 'bg-white/20 text-white'
                                    : item.difficulty === 'Easy'
                                      ? 'bg-green-100 text-green-700'
                                      : item.difficulty === 'Medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.difficulty}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-blue-600 text-sm italic">
                        No problems found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Show normal subtopic structure
                subTopics.map((subTopic) => {
                  const subTopicContent = getContentForSubTopic(subTopic);
                  const isExpanded = expandedSubTopics.has(subTopic);
                  const isSelected = selectedSubTopic === subTopic;

                return (
                  <div key={subTopic} className="space-y-1">
                    {/* Subtopic Header */}
                    <button
                      onClick={() => toggleSubTopic(subTopic)}
                      className={`subtopic-header w-full text-left p-2 rounded transition-smooth flex items-center justify-between group ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div className={`transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                          <FiChevronRight className="h-3 w-3" />
                        </div>
                        <span className="font-medium text-xs truncate">{subTopic}</span>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <span className={`text-xs px-1 py-0.5 rounded font-medium ${
                          isSelected
                            ? 'bg-indigo-200 text-indigo-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {subTopicContent.length}
                        </span>
                      </div>
                    </button>

                    {/* Problems List */}
                    {isExpanded && (
                      <div className="ml-3 space-y-1 animate-fade-in">
                        {subTopicContent.length > 0 ? (
                          subTopicContent.map((item) => (
                            <div key={item._id} className={`problem-item flex items-center space-x-2 p-1.5 rounded transition-smooth group ${
                              contentProgress[item._id] ? 'completed' : ''
                            } ${selectedContent?._id === item._id ? 'selected' : ''}`}>
                              {/* Completion Checkbox */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleContentProgress(item._id);
                                }}
                                className={`progress-checkbox flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center focus-ring ${
                                  contentProgress[item._id]
                                    ? 'completed'
                                    : 'border-gray-300 hover:border-green-400 bg-white hover:shadow-sm'
                                }`}
                                title={contentProgress[item._id] ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                {contentProgress[item._id] && (
                                  <FiCheck className="h-2 w-2" />
                                )}
                              </button>

                              {/* Content Button */}
                              <button
                                onClick={() => selectContent(item)}
                                className={`flex-1 text-left rounded transition-smooth min-w-0 focus-ring ${
                                  selectedContent?._id === item._id
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                                    : 'hover:bg-blue-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 p-1.5">
                                  <FiPlay className={`h-2.5 w-2.5 flex-shrink-0 ${
                                    selectedContent?._id === item._id ? 'text-white' : 'text-blue-500'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${
                                      selectedContent?._id === item._id ? 'text-white' :
                                      contentProgress[item._id] ? 'text-green-700' : 'text-gray-900'
                                    }`}>
                                      {searchTerm ? highlightText(item.title, searchTerm) : item.title}
                                    </p>
                                    <div className="flex items-center space-x-1 mt-0.5">
                                      {item.difficulty && (
                                        <span className={`text-xs px-1 py-0.5 rounded font-medium ${
                                          selectedContent?._id === item._id
                                            ? 'bg-white/20 text-white'
                                            : item.difficulty === 'Easy'
                                              ? 'bg-green-100 text-green-700'
                                              : item.difficulty === 'Medium'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                          {item.difficulty}
                                        </span>
                                      )}
                                      {contentProgress[item._id] && (
                                        <span className={`text-xs px-1 py-0.5 rounded font-medium flex items-center space-x-0.5 progress-indicator ${
                                          selectedContent?._id === item._id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          <FiCheck className="h-2 w-2" />
                                          <span>✓</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500 text-sm italic">
                            No problems added yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Content Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {selectedSubTopic}
              </h1>
              <p className="text-gray-500 text-xs">
                {getContentForSubTopic(selectedSubTopic).length} problems
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder={`Search ${categoryTitle}...`}
                  value={searchTerm}
                  onChange={(e) => performTopicSearch(e.target.value)}
                  className="pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm w-64"
                />
                {searchTerm && (
                  <button
                    onClick={clearTopicSearch}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <div className="flex items-center justify-between">
                <p className="text-blue-800 text-xs font-medium">
                  {filteredContent.length} result{filteredContent.length !== 1 ? 's' : ''} for "{searchTerm}"
                </p>
                <button
                  onClick={clearTopicSearch}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Display */}
        <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
          {selectedContent ? (
            <div className="max-w-4xl mx-auto">
              {/* Content Header */}
              <div className="mb-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white/20">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {selectedContent.title}
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Category:</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-medium">
                        {selectedContent.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">Topic:</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-medium">
                        {selectedContent.subTopic}
                      </span>
                    </div>
                    {selectedContent.difficulty && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Difficulty:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          selectedContent.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          selectedContent.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedContent.difficulty}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem Statement */}
              {selectedContent.problemStatement && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                    <FiFileText className="mr-1.5 h-3.5 w-3.5" />
                    Problem Statement
                  </h3>
                  <div className="prose prose-sm max-w-none text-sm">
                    <ReactMarkdown>{selectedContent.problemStatement}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Images */}
              {selectedContent.images && selectedContent.images.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <FiImage className="mr-1.5 h-3.5 w-3.5" />
                    Images
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {selectedContent.images.map((image, index) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        <img
                          src={image.url || image.path || `/uploads/${image.filename}`}
                          alt={`Image ${index + 1}`}
                          className="w-full h-64 object-contain cursor-pointer"
                          onClick={() => window.open(image.url || image.path || `/uploads/${image.filename}`, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Example */}
              {selectedContent.codeExample && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <FiCode className="mr-1.5 h-3.5 w-3.5" />
                    Example
                  </h3>
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <SyntaxHighlighter
                      style={tomorrow}
                      language="javascript"
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {selectedContent.codeExample}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}

              {/* Main Content (Constraints) */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <FiFileText className="mr-1.5 h-3.5 w-3.5" />
                  Constraints
                </h3>
                <div className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-200 text-sm">
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={tomorrow}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {selectedContent.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Solution */}
              {selectedContent.solution && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                    <FiCode className="mr-1.5 h-3.5 w-3.5" />
                    Solution
                  </h3>
                  <div className="prose prose-sm max-w-none text-sm">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {selectedContent.solution}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedContent.tags && selectedContent.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-lg opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-8 mx-auto w-32 h-32 flex items-center justify-center">
                    <FiFileText className="h-16 w-16 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No matching problems found' : 'Select a problem to get started'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {searchTerm
                    ? `No problems match your search "${searchTerm}". Try adjusting your search terms.`
                    : getContentForSubTopic(selectedSubTopic).length === 0
                      ? `No problems are available for ${selectedSubTopic} at the moment. Please check back later or explore other topics.`
                      : `Choose a problem from the ${selectedSubTopic} section in the sidebar to view its details.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyContent;
