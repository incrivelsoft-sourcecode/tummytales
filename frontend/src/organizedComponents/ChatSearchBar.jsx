// SearchBar.jsx
import React, { useState, useEffect } from 'react';
import { BiSearch, BiX } from 'react-icons/bi';

const SearchBar = ({ onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      try {
        // Replace with your API endpoint
        const response = await fetch(`/api/users/search?term=${searchTerm}`);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username or email"
          className="w-full p-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
        <BiSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
        {searchTerm && (
          <button 
            onClick={clearSearch}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <BiX size={18} />
          </button>
        )}
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-2 bg-white border border-gray-300 rounded-lg max-h-60 overflow-y-auto shadow-md">
          {searchResults.map(user => (
            <div 
              key={user._id}
              onClick={() => {
                onUserSelect(user);
                clearSearch();
              }}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
            >
              <div className="font-medium">{user.user_name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          ))}
        </div>
      )}
      
      {isLoading && searchTerm.length >= 2 && (
        <div className="mt-2 p-3 text-center text-gray-500">
          Searching...
        </div>
      )}
      
      {!isLoading && searchTerm.length >= 2 && searchResults.length === 0 && (
        <div className="mt-2 p-3 text-center text-gray-500">
          No users found.
        </div>
      )}
    </div>
  );
};

export default SearchBar;