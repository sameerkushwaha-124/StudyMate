import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [allContent, setAllContent] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all content on mount
  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      const response = await axios.get('/api/content');
      setAllContent(response.data);
    } catch (error) {
      console.error('Error fetching all content:', error);
    }
  };

  const performGlobalSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const results = allContent.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const contentMatch = item.content.toLowerCase().includes(query.toLowerCase());
      const problemStatementMatch = item.problemStatement?.toLowerCase().includes(query.toLowerCase());
      const solutionMatch = item.solution?.toLowerCase().includes(query.toLowerCase());
      const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      return titleMatch || contentMatch || problemStatementMatch || solutionMatch || tagsMatch;
    });

    setSearchResults(results);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const refreshContent = () => {
    fetchAllContent();
  };

  return (
    <SearchContext.Provider
      value={{
        allContent,
        searchResults,
        isSearching,
        searchQuery,
        performGlobalSearch,
        clearSearch,
        refreshContent
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
