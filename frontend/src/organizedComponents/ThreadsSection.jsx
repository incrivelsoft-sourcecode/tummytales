import React, { useState, useRef, forwardRef, useEffect } from 'react';
import ThreadItem from './ThreadItem';

const ThreadsSection = forwardRef(({ 
  threads, 
  isExpanded, 
  isLoading, 
  isSearching, 
  searchTerm, 
  totalThreads, 
  hasMore, 
  onToggleSection, 
  onSelectThread, 
  selectedThread,
  loadMoreThreads,
  sidebarWidth,
  currentPage,
  totalPages,
  onPageChange
}, ref) => {
  const threadsEndRef = useRef(null);
  const [expandedTitles, setExpandedTitles] = useState({});


  const toggleTitleExpansion = (threadId, e) => {
    e.stopPropagation();
    setExpandedTitles(prev => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
  };

  // Handle pagination with page buttons
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center space-x-2 py-2 sticky bottom-0 bg-white shadow-md">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-2 py-1 rounded text-xs ${
            currentPage === 1 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          Prev
        </button>
        
        <span className="text-xs text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-2 py-1 rounded text-xs ${
            currentPage === totalPages 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <button 
        onClick={onToggleSection}
        className="w-full flex justify-between items-center font-bold text-lg mb-2 text-left hover:text-purple-700 focus:outline-none flex-shrink-0"
      >
        <span>
          {isSearching 
            ? `Search Results: "${searchTerm}" (${totalThreads || 0})`
            : `Threads (${totalThreads || 0})`
          }
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 transition-transform ${isExpanded ? '' : 'transform rotate-180'}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Threads Content */}
      <div 
        ref={ref}
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-0 max-h-0'}`}
        style={{
          overflowY: isExpanded ? 'auto' : 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: totalPages > 1 ? '40px' : '0' }}>
          {isLoading && threads.length === 0 ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
            </div>
          ) : threads.length === 0 ? (
            <p className="text-gray-500 text-sm px-3 py-2">
              {isSearching ? `No results for "${searchTerm}"` : 'No threads yet.'}
            </p>
          ) : (
            <ul className="mb-2">
              {threads.map((thread) => (
                <ThreadItem 
                  key={thread._id}
                  thread={thread}
                  isSelected={selectedThread && selectedThread._id === thread._id}
                  isExpanded={expandedTitles[thread._id]}
                  onSelectThread={onSelectThread}
                  onToggleExpansion={toggleTitleExpansion}
                  sidebarWidth={sidebarWidth}
                />
              ))}
              {/* End marker for intersection observer */}
              <div ref={threadsEndRef} className="h-4" />
            </ul>
          )}
        </div>
        
        {/* Pagination controls - now sticky at bottom */}
        {isExpanded && renderPagination()}
      </div>
    </div>
  );
});

export default ThreadsSection;