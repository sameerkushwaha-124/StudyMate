import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';

const CompactDropdown = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select an option...",
  showAddOption = false,
  addOptionText = "Add New",
  className = "",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (selectedValue) => {
    onChange({ target: { name: 'subTopic', value: selectedValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const selectedOption = options.find(opt => opt === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className={`input-field w-full text-left flex items-center justify-between ${
          !value ? 'text-gray-500' : 'text-gray-900'
        }`}
        required={required}
      >
        <span className="truncate">
          {selectedOption || placeholder}
        </span>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Options List - Compact and Scrollable */}
          <div className="max-h-48 overflow-y-auto">
            {/* Default option */}
            {!searchTerm && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  !value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                }`}
              >
                {placeholder}
              </button>
            )}

            {/* Filtered Options */}
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                  option === value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="block truncate">{option}</span>
              </button>
            ))}

            {/* Add New Option */}
            {showAddOption && (
              <button
                type="button"
                onClick={() => handleSelect('OTHER')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors border-t border-gray-200 text-green-700 font-medium flex items-center space-x-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>{addOptionText}</span>
              </button>
            )}

            {/* No Results */}
            {searchTerm && filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No topics found matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {filteredOptions.length} topic{filteredOptions.length !== 1 ? 's' : ''} available
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactDropdown;
