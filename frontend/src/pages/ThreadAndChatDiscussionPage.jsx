import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// Import Thread components
import ThreadContent from '../organizedComponents/ThreadContent';
import ThreadForm from '../organizedComponents/ThreadForm';
import ErrorDisplay from '../organizedComponents/ErrorDisplay';
import ThreadsSection from '../organizedComponents/ThreadsSection';

// Import Chat components
import ChatContent from '../organizedComponents/ChatContent';
import ChatForm from '../organizedComponents/ChatForm';
import SearchBar from '../organizedComponents/SearchBar';
import ChatsSection from '../organizedComponents/ChatSection';

// Resizable Sidebar component
const ResizableSidebar = ({ 
  children, 
  minWidth = 250, 
  maxWidth = 400, 
  defaultWidth = 320 
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  // Mouse down event handler to start resizing
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Mouse move event handler to resize sidebar
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  }, [isResizing, minWidth, maxWidth]);

  // Mouse up event handler to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={sidebarRef}
      className="bg-white border-r border-gray-300 flex flex-col h-screen relative"
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resizer handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-gray-300 cursor-ew-resize hover:bg-purple-500 transition-colors"
        onMouseDown={handleMouseDown}
        style={{ 
          cursor: isResizing ? 'ew-resize' : 'col-resize',
          opacity: isResizing ? 1 : 0.5
        }}
      />
    </div>
  );
};

// Unified Sidebar component
const UnifiedSidebar = ({ 
  activeTab,
  onTabChange,
  threads,
  isLoading,
  selectedThread,
  onSelectThread,
  chatUsers,
  searchTerm,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  noResults,
  chats,
  currentUser,
  chatExpanded,
  onToggleChatSection,
  activeChatId,
  onChatSelect,
  totalThreads,
  isSearching
}) => {
  const threadsRef = useRef(null);
  const [threadsExpanded, setThreadsExpanded] = useState(true);
  const sidebarRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [searchUser, setSearchUser] = useState('');

  // Update sidebar width when it changes
  useEffect(() => {
    if (sidebarRef.current) {
      setSidebarWidth(sidebarRef.current.offsetWidth);
    }
  }, [sidebarRef.current?.offsetWidth]);

  return (
    <ResizableSidebar ref={sidebarRef}>
      <div className="p-4 bg-purple-100 border-b border-gray-300 flex-shrink-0">
        <div className="flex">
          <button 
            className={`mr-2 px-4 py-2 rounded-t-lg ${activeTab === 'threads' ? 'bg-purple-800 text-white' : 'bg-gray-200'}`}
            onClick={() => onTabChange('threads')}
          >
            Threads
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'chats' ? 'bg-purple-800 text-white' : 'bg-gray-200'}`}
            onClick={() => onTabChange('chats')}
          >
            Chats
          </button>
        </div>
      </div>
      
      {activeTab === 'threads' ? (
        // Thread sidebar content
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sticky top-0 bg-white z-10 border-b">
            <input
              type="text"
              placeholder="Search threads..."
              className="w-full p-2 border rounded"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <div className="p-2 flex-1">
            <ThreadsSection
              ref={threadsRef}
              threads={threads}
              isExpanded={threadsExpanded}
              isLoading={isLoading}
              isSearching={isSearching}
              searchTerm={searchTerm}
              totalThreads={totalThreads}
              hasMore={currentPage < totalPages}
              onToggleSection={() => setThreadsExpanded(!threadsExpanded)}
              onSelectThread={onSelectThread}
              selectedThread={selectedThread}
              loadMoreThreads={() => onPageChange(currentPage + 1)}
              sidebarWidth={sidebarWidth}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      ) : (
        // Chat sidebar content
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sticky top-0 bg-white z-10 border-b">
            <SearchBar searchTerm={searchUser} onSearchChange={setSearchUser}  />
          </div>
          
          <div className="flex-1 overflow-y-auto px-2">
            <ChatsSection 
              chats={chats}
              currentUser={currentUser}
              isExpanded={chatExpanded}
              onToggleSection={onToggleChatSection}
              activeChatId={activeChatId}
              onChatSelect={onChatSelect}
            />
          </div>
        </div>
      )}
    </ResizableSidebar>
  );
};

// Integrated Communication Page
const IntegratedCommunicationPage = () => {
  // Common state
  const [activeTab, setActiveTab] = useState('threads'); // 'threads' or 'chats'
  
  // Thread-related state
  const userId = useMemo(() => localStorage.getItem("userId"), []);
  const userName = useMemo(() => localStorage.getItem("userName"), []);
  const threadSocket = useMemo(() => io(`http://localhost:5002?userId=${userId}`), [userId]);
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
  
  // Chat-related state
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSocket = useMemo(() => io('http://localhost:5000'), []);
  
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
    if (activeTab !== 'threads') return;
    
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
  }, [threadSocket, activeTab, searchTerm, processSearchResults, selectedThread, searchResults]);

  // Chat socket setup
  useEffect(() => {
    if (activeTab !== 'chats') return;
    
    // Set current user (normally from auth system)
    const user = JSON.parse(localStorage.getItem('user')) || { _id: userId, user_name: userName };
    setCurrentUser(user);
    
    // Chat socket listeners
    if (user) {
      chatSocket.on('receiveMessage', (message) => {
        if (selectedUser && 
          (message.sender._id === selectedUser._id || message.receiver._id === selectedUser._id)) {
          setMessages(prev => [...prev, message]);
        }
        
        // Update chat list
        updateChatList();
      });

      chatSocket.on('messageUpdated', (updatedMessage) => {
        setMessages(prev => 
          prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
        );
      });

      chatSocket.on('messageDeleted', (messageId) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      });

      chatSocket.on('error', (error) => {
        console.error('Chat socket error:', error);
      });
    }

    return () => {
      chatSocket.off('receiveMessage');
      chatSocket.off('messageUpdated');
      chatSocket.off('messageDeleted');
      chatSocket.off('error');
    };
  }, [chatSocket, activeTab, selectedUser, userId, userName]);

  // Load chat messages when a chat is selected
  useEffect(() => {
    if (activeTab === 'chats' && currentChatId && currentUser) {
      setIsChatLoading(true);
      chatSocket.emit('getMessages', {
        chatId: currentChatId,
        userId: currentUser._id,
        limit: 50
      });

      chatSocket.once('messagesPaginated', (data) => {
        setMessages(data.messages || []);
        setIsChatLoading(false);
      });
    }
  }, [currentChatId, currentUser, chatSocket, activeTab]);

  // Load initial chats
  useEffect(() => {
    if (activeTab === 'chats' && currentUser) {
      updateChatList();
    }
  }, [currentUser, activeTab]);

  // Fetch user's chat list
  const updateChatList = async () => {
    try {
      // Simulating API call - replace with actual API call
      // const response = await fetch(`/api/chats/${currentUser._id}`);
      // const data = await response.json();
      
      // Mocked data for example
      const mockedData = [
        { 
          _id: 'chat1', 
          participants: [
            { _id: currentUser?._id, user_name: currentUser?.user_name },
            { _id: 'user1', user_name: 'Ashna', email: 'ashna@example.com' }
          ], 
          lastMessage: { content: 'Hello!', timestamp: new Date() }
        },
        { 
          _id: 'chat2', 
          participants: [
            { _id: currentUser?._id, user_name: currentUser?.user_name },
            { _id: 'user2', user_name: 'Nikita', email: 'nikita@example.com' }
          ], 
          lastMessage: { content: 'How are you?', timestamp: new Date() }
        }
      ];
      
      setChats(mockedData);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Handle thread creation
  const handleCreateThread = (title, file, mimetype) => {
    const threadData = {
      creator: userId,
      title: title,
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

  // Handle chat selection
  const handleChatSelect = (chat, otherUser) => {
    setSelectedUser(otherUser);
    setCurrentChatId(chat._id);
    setEditingMessage(null);
  };

  // Send a chat message
  const handleSendMessage = (content, file) => {
    if ((!content && !file) || !currentUser || !selectedUser) return;
    
    const messageData = {
      sender: currentUser._id,
      receiver: selectedUser._id,
      content: content,
      file: file
    };

    chatSocket.emit('sendMessage', messageData);
  };

  // Update a chat message
  const handleUpdateMessage = (messageId, newContent) => {
    if (!newContent.trim()) return;
    
    chatSocket.emit('updateMessage', {
      messageId: messageId,
      userId: currentUser._id,
      newContent: newContent
    });
  };

  // Delete a chat message
  const handleDeleteMessage = (messageId) => {
    chatSocket.emit('deleteMessage', {
      messageId,
      userId: currentUser._id
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Unified Sidebar */}
      <UnifiedSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        
        // Thread props
        threads={threads}
        isLoading={isThreadLoading}
        selectedThread={selectedThread}
        onSelectThread={handleThreadSelection}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        noResults={threads.length === 0 && !isThreadLoading}
        totalThreads={totalThreads}
        isSearching={isSearching}
        
        // Chat props
        chats={chats}
        currentUser={currentUser}
        chatExpanded={chatExpanded}
        onToggleChatSection={() => setChatExpanded(!chatExpanded)}
        activeChatId={currentChatId}
        onChatSelect={handleChatSelect}
      />

      {/* Main content area - conditionally render Thread or Chat */}
      <div className="flex-1 p-4 min-w-[400px] overflow-y-auto" style={{ height: '100vh' }}>
        {activeTab === 'threads' ? (
          /* Thread content */
          <>
            <ErrorDisplay error={threadError} />
            <ThreadForm onCreateThread={handleCreateThread} />
            <ThreadContent 
              selectedThread={selectedThread}
              onDeleteThread={handleDeleteThread}
              onReplyToThread={handleReplyToThread}
              currentUserId={userId}
              searchTerm={searchTerm}
            />
          </>
        ) : (
          /* Chat content */
          <>
            {/* Chat Header */}
            {selectedUser && (
              <div className="p-4 bg-white border-b border-gray-300 flex items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold">{selectedUser.user_name}</h2>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
            )}
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-hidden bg-white rounded-lg shadow-sm">
              <ChatContent 
                messages={messages}
                currentUser={currentUser}
                selectedUser={selectedUser}
                isLoading={isChatLoading}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={setEditingMessage}
              />
            </div>
            
            {/* Chat Input */}
            {selectedUser && (
              <div className="mt-4">
                <ChatForm 
                  onSendMessage={handleSendMessage}
                  onUpdateMessage={handleUpdateMessage}
                  editingMessage={editingMessage}
                  setEditingMessage={setEditingMessage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IntegratedCommunicationPage;