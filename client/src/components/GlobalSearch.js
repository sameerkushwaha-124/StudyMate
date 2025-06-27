import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { FiSearch, FiX, FiFileText, FiCode, FiArrowRight } from 'react-icons/fi';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  const { searchResults, isSearching, performGlobalSearch, clearSearch } = useSearch();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }

      // Escape to close search
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clearSearch]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    performGlobalSearch(searchQuery);
  };

  const handleResultClick = (content) => {
    const category = content.category === 'OOP' ? 'oop' : 'dsa';
    navigate(`/study/${category}`, { 
      state: { 
        selectedContent: content,
        selectedSubTopic: content.subTopic 
      } 
    });
    setIsOpen(false);
    setQuery('');
    clearSearch();
  };

  const handleClear = () => {
    setQuery('');
    clearSearch();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-white/80 hover:bg-white backdrop-blur-sm border-2 border-gray-300 hover:border-indigo-400 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900 shadow-sm hover:shadow-md"
      >
        <FiSearch className="h-4 w-4" />
        <span className="hidden md:inline text-sm">Search problems...</span>
        <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-mono bg-white/20 rounded border border-white/30">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          {/* Search Panel */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center p-4 border-b border-gray-200">
              <FiSearch className="h-5 w-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search problems, solutions, and content..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 text-lg outline-none placeholder-gray-400"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="ml-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600">Searching...</span>
                </div>
              ) : query && searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No problems found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
                </div>
              ) : query && searchResults.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </div>
                  {searchResults.map((result) => (
                    <button
                      key={result._id}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <FiCode className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                            <h3 className="font-semibold text-gray-900 truncate">
                              {highlightText(result.title, query)}
                            </h3>
                          </div>
                          
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                              {result.category}
                            </span>
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                              {result.subTopic}
                            </span>
                            {result.difficulty && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getDifficultyColor(result.difficulty)}`}>
                                {result.difficulty}
                              </span>
                            )}
                          </div>

                          {result.problemStatement && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {highlightText(result.problemStatement.substring(0, 150) + '...', query)}
                            </p>
                          )}
                        </div>
                        
                        <FiArrowRight className="h-4 w-4 text-gray-400 ml-3 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiSearch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Start typing to search</p>
                  <p className="text-gray-400 text-sm">Search across all problems and solutions</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Press ESC to close</span>
                <span>⌘K to open search</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
