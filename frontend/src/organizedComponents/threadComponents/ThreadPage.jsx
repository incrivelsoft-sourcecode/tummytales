// ThreadPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';

// Import Thread components
import ThreadContent from './ThreadContent';
import ThreadForm from './ThreadForm';
import ErrorDisplay from '../ErrorDisplay';
import ThreadsSection from './ThreadsSection';
import ResizableSidebar from '../ResizableSidebar';

const ThreadPage = ({ userId, userName, token }) => {
  const threadSocket = useMemo(() => io(`${process.env.REACT_APP_CHAT_BACKEND_URL}?userId=${userId}`), [userId]);
  const [threads, setThreads] = useState([]);
  const [isThreadLoading, setIsThreadLoading] = useState(true);
  const [threadError, setThreadError] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalThreads, setTotalThreads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [threadsExpanded, setThreadsExpanded] = useState(true);
  const threadsRef = useRef(null);
  const sidebarRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  // Update sidebar width when it changes
  useEffect(() => {
    if (sidebarRef.current) {
      setSidebarWidth(sidebarRef.current.offsetWidth);
    }
  }, [sidebarRef.current?.offsetWidth]);

  // Function to format highlighted content for search
  const formatHighlightedContent = useCallback((content, term) => {
    if (!content || !term) return content;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, '<span class="bg-yellow-200">$1</span>');
  }, []);

  // Process search results and add highlighting
  const processSearchResults = useCallback((results, term) => {
    if (!results?.threads || !term) return results;

    return {
      ...results,
      threads: results.threads.map(thread => {
        const processedThread = { ...thread };
        
        if (thread.title && thread.title.toLowerCase().includes(term.toLowerCase())) {
          processedThread.highlightedTitle = formatHighlightedContent(thread.title, term);
        }
        
        if (thread.searchMatch && thread.searchMatch.field === 'message') {
          processedThread.highlightedMessage = {
            messageId: thread.searchMatch.messageId,
            highlightedContent: formatHighlightedContent(thread.searchMatch.value, term)
          };
        }
        
        return processedThread;
      })
    };
  }, [formatHighlightedContent]);

  // Handle search term changes for threads
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    
    if (term.trim() === '') {
      setSearchResults(null);
      setIsSearching(false);
      threadSocket.emit('getThreads', { page: 1, limit: 10 });
    } else {
      setIsThreadLoading(true);
      setIsSearching(true);
      threadSocket.emit('searchThreads', { 
        searchTerm: term,
        page: 1,
        limit: 10,
        includeMessages: true,
        includeUsers: true
      });
    }
  };

  // Handle thread pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setIsThreadLoading(true);
    
    if (searchTerm.trim() === '') {
      threadSocket.emit('getThreads', { page: newPage, limit: 15 });
    } else {
      threadSocket.emit('searchThreads', {
        searchTerm,
        page: newPage,
        limit: 15,
        includeMessages: true,
        includeUsers: true
      });
    }
  };

  // Thread socket setup
  useEffect(() => {
    threadSocket.emit('getThreads', { page: 1, limit: 15 });

    threadSocket.on('paginatedThreads', (data) => {
      setThreads(data.threads);
      setTotalThreads(data.pagination.totalThreads);
      setTotalPages(data.pagination.totalPages);
      setIsThreadLoading(false);
      setSearchResults(null);
      
      if (data.threads.length > 0 && !selectedThread) {
        setSelectedThread(data.threads[0]);
      } else if (data.threads.length === 0) {
        setSelectedThread(null);
      }
    });

    threadSocket.on('allThreads', (data) => {
      if (!searchResults) {
        setThreads(data);
        setIsThreadLoading(false);
        
        if (data.length > 0 && !selectedThread) {
          setSelectedThread(data[0]);
        } else if (data.length === 0) {
          setSelectedThread(null);
        }
      }
    });

    threadSocket.on('searchResults', (results) => {
      const processedResults = processSearchResults(results, searchTerm);
      setSearchResults(processedResults);
      setThreads(processedResults.threads);
      setTotalThreads(processedResults.pagination.totalThreads);
      setTotalPages(processedResults.pagination.totalPages);
      setIsThreadLoading(false);
      
      if (processedResults.threads.length > 0) {
        setSelectedThread(processedResults.threads[0]);
      } else {
        setSelectedThread(null);
      }
    });

    threadSocket.on('threadCreated', (newThread) => {
      if (!searchResults) {
        setThreads(prevThreads => [newThread, ...prevThreads]);
        setTotalThreads(prev => prev + 1);
      }
    });

    threadSocket.on('threadUpdated', (updatedThread) => {
      setThreads(prevThreads =>
        prevThreads.map(thread =>
          thread._id === updatedThread._id ? updatedThread : thread
        )
      );
      
      if (selectedThread && selectedThread._id === updatedThread._id) {
        setSelectedThread(updatedThread);
      }
    });

    threadSocket.on('threadDeleted', (threadId) => {
      setThreads(prevThreads => {
        const filteredThreads = prevThreads.filter(thread => thread._id !== threadId);
        if (selectedThread && selectedThread._id === threadId) {
          setSelectedThread(filteredThreads.length > 0 ? filteredThreads[0] : null);
        }
        return filteredThreads;
      });
      setTotalThreads(prev => Math.max(0, prev - 1));
    });

    threadSocket.on('threadReplyAdded', ({ threadId, message }) => {
      setThreads(prevThreads =>
        prevThreads.map(thread => {
          if (thread._id === threadId) {
            const updatedThread = {
              ...thread,
              messages: [...thread.messages, message]
            };
            
            if (selectedThread && selectedThread._id === threadId) {
              setSelectedThread(updatedThread);
            }
            
            return updatedThread;
          }
          return thread;
        })
      );
    });

    threadSocket.on('error', (errorData) => {
      setThreadError(errorData);
      setIsThreadLoading(false);
      setTimeout(() => setThreadError(null), 5000);
    });

    return () => {
      threadSocket.off('allThreads');
      threadSocket.off('paginatedThreads');
      threadSocket.off('searchResults');
      threadSocket.off('threadCreated');
      threadSocket.off('threadUpdated');
      threadSocket.off('threadDeleted');
      threadSocket.off('threadReplyAdded');
      threadSocket.off('error');
    };
  }, [threadSocket, searchTerm, processSearchResults, selectedThread, searchResults]);

  // Handle thread creation
  const handleCreateThread = (title, content, file, mimetype) => {
    const threadData = {
      creator: userId,
      title: title,
      content: content,
      participants: [userId],
      file: file,
      mimetype: mimetype 
    };

    threadSocket.emit('createThread', threadData);
  };

  // Handle thread deletion
  const handleDeleteThread = (threadId) => {
    if (window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      threadSocket.emit('deleteThread', { threadId });
    }
  };

  // Handle thread selection
  const handleThreadSelection = (thread) => {
    setSelectedThread(thread);
  };

  // Handle reply to thread
  const handleReplyToThread = (threadId, content, file, mimetype) => {
    threadSocket.emit('replyToThread', {
      threadId: threadId,
      sender: userId,
      content: content,
      file: file,
      mimetype: mimetype
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Thread Sidebar */}
      <ResizableSidebar ref={sidebarRef}>
        <div className="p-4 bg-purple-100 border-b border-gray-300 flex-shrink-0">
          <h2 className="text-lg font-bold">Threads</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sticky top-0 bg-white z-10 border-b">
            <input
              type="text"
              placeholder="Search threads..."
              className="w-full p-2 border rounded"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          
          <div className="p-2 flex-1">
            <ThreadsSection
              ref={threadsRef}
              threads={threads}
              isExpanded={threadsExpanded}
              isLoading={isThreadLoading}
              isSearching={isSearching}
              searchTerm={searchTerm}
              totalThreads={totalThreads}
              hasMore={currentPage < totalPages}
              onToggleSection={() => setThreadsExpanded(!threadsExpanded)}
              onSelectThread={handleThreadSelection}
              selectedThread={selectedThread}
              loadMoreThreads={() => handlePageChange(currentPage + 1)}
              sidebarWidth={sidebarWidth}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </ResizableSidebar>

      {/* Main content area */}
      <div className="flex-1 p-4 min-w-[400px] overflow-y-auto" style={{ height: '100vh' }}>
        <ErrorDisplay error={threadError} />
        <ThreadForm onCreateThread={handleCreateThread} />
        <ThreadContent 
          selectedThread={selectedThread}
          onDeleteThread={handleDeleteThread}
          onReplyToThread={handleReplyToThread}
          currentUserId={userId}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
};

export default ThreadPage