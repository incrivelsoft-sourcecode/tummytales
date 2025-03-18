import React from 'react';
import format from "date-fns/format";

const ThreadItem = ({ 
  thread, 
  isSelected, 
  isExpanded, 
  onSelectThread, 
  onToggleExpansion,
  sidebarWidth
}) => {
  const userName = localStorage.getItem("userName");

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return format(date, 'PPp');
  };

  // Display thread title with at least 20 characters visible by default
  const displayTitle = () => {
    const baseLength = 30;
    const widthFactor = sidebarWidth / 256;
    const maxLength = Math.max(baseLength, Math.floor(baseLength * widthFactor)); // Ensure at least 20 characters

    if (thread.highlightedTitle) {
      return isExpanded ? (
        <div dangerouslySetInnerHTML={{ __html: thread.highlightedTitle }} />
      ) : (
        <div dangerouslySetInnerHTML={{ 
          __html: thread.highlightedTitle.length > maxLength
            ? thread.highlightedTitle.substring(0, maxLength) + '...'
            : thread.highlightedTitle 
        }} />
      );
    }

    // Ensure at least 20 characters are visible before truncation
    if (isExpanded || thread.title.length <= maxLength) {
      return thread.title;
    }

    return (
      <>
        {thread.title.substring(0, maxLength)}
        <span 
          className="text-purple-600 cursor-pointer ml-1"
          onClick={(e) => onToggleExpansion(thread._id, e)}
        >
          ...
        </span>
      </>
    );
  };

  return (
    <li className="mb-2">
      <button 
        className={`w-full text-left py-2 px-3 rounded border ${
          isSelected
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:bg-gray-100'
        } transition break-words`}
        onClick={() => onSelectThread(thread)}
      >
        {/* Thread Title */}
        {isExpanded ? (
          <>
            {thread.highlightedTitle ? (
              <div dangerouslySetInnerHTML={{ __html: thread.highlightedTitle }} />
            ) : (
              thread.title
            )}
            <span 
              className="text-purple-600 cursor-pointer ml-1"
              onClick={(e) => onToggleExpansion(thread._id, e)}
            >
              (collapse)
            </span>
          </>
        ) : (
          displayTitle()
        )}
        
        {/* User and Date Info */}
        <div className="text-xs text-gray-500 mt-1">
          {thread.creator?.user_name === userName ? "Me" : thread.creator?.user_name || 'Anonymous'} • {formatTimestamp(thread.createdAt)}
        </div>
        
        {/* Highlighted Message Preview (if available from search) */}
        {thread.highlightedMessage && (
          <div className="mt-2 text-xs border-t pt-1 border-gray-200">
            <div className="font-medium text-purple-600">Message match:</div>
            <div 
              className="text-gray-600 mt-1 bg-gray-50 p-1 rounded overflow-hidden"
              dangerouslySetInnerHTML={{ __html: thread.highlightedMessage.highlightedContent }}
            />
          </div>
        )}
      </button>
    </li>
  );
};

export default ThreadItem;
