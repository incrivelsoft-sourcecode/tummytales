// ChatPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';

// Import Chat components
import ChatContent from './ChatContent';
import ChatForm from './ChatForm';
import SearchBar from './SearchBar';
import ChatsSection from './ChatSection';
import ResizableSidebar from '../ResizableSidebar';

const ChatPage = ({ userId, userName }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const socketRef = useRef(null);
  const sidebarRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    // Set current user (from auth system)
    const user = { _id: userId, user_name: userName };
    setCurrentUser(user);
    
    // Initialize socket connection
    socketRef.current = io(`${process.env.REACT_APP_CHAT_BACKEND_URL}?userId=${userId}`);
    
    // Set up error handling
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      // You might want to add toast notifications here
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, userName]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socketRef.current || !currentUser) return;
    
    // Message received event
    socketRef.current.on('receiveMessage', (message) => {
      // Add message to current chat if it belongs there
      console.log("Recieved message: ", message)
      if (selectedUser && (
        (message.sender === selectedUser._id && message.receiver === currentUser._id) ||
        (message.sender === currentUser._id && message.receiver === selectedUser._id)
      )) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update chat list to reflect new message
      socketRef.current.emit('getChats', { userId: currentUser._id });
    });
    
    // Message sent event
    socketRef.current.on('messageSent', (message) => {
      // Handle when a message is successfully sent
      setMessages(prev => [...prev, message]);
      
      // Refresh chat list to show new chat
      socketRef.current.emit('getChats', { userId: currentUser._id });
    });
    
    // Message updated event
    socketRef.current.on('messageUpdated', (updatedMessage) => {
      setMessages(prev => 
        prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
      );
    });
    
    // Message deleted event
    socketRef.current.on('messageDeleted', (messageId) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });
    
    socketRef.current.on('chatsPaginated', (data) => {
      console.log("chatsPaginated", data);
      setChats(data.chats || []);
    });

    // User search results
    socketRef.current.on('usersPaginated', (data) => {
      console.log("usersPaginated", data);
      // This will be handled by the SearchBar component
    });
    
    // Cleanup listeners
    return () => {
      socketRef.current.off('receiveMessage');
      socketRef.current.off('messageSent');
      socketRef.current.off('messageUpdated');
      socketRef.current.off('messageDeleted');
      socketRef.current.off('chatsPaginated');
      socketRef.current.off('usersPaginated');
    };
  }, [currentUser, selectedUser]);

  // Fetch chats when user is set
  useEffect(() => {
    if (currentUser && socketRef.current) {
      socketRef.current.emit('getChats', { userId: currentUser._id });
    }
  }, [currentUser]);

  // Load messages when a chat is selected
  useEffect(() => {
    if (currentChatId && currentUser) {
      loadMessages();
    }
  }, [currentChatId]);

  // Auto scroll to bottom when new message is sent or received
  useEffect(() => {
    if (messages.length > 0 && messageContainerRef.current && !isLoadingMore) {
      const container = messageContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoadingMore]);

  // Load messages for selected chat
  const loadMessages = (cursor = null) => {
    if (!socketRef.current || !currentChatId) return;
    
    cursor ? setIsLoadingMore(true) : setIsChatLoading(true);
    
    socketRef.current.emit('getMessages', {
      chatId: currentChatId,
      userId: currentUser._id,
      limit: 50,
      next: cursor
    });
    
    const handleMessageResponse = (data) => {
      console.log("messages: ", data);
      if (cursor) {
        // Append older messages at the beginning
        setMessages(prev => [...data.messages.reverse(), ...prev]);
        setIsLoadingMore(false);
      } else {
        // New chat selected, replace messages
        setMessages(data.messages ? data.messages.reverse() : []);
        setIsChatLoading(false);
      }
      
      // Store pagination info
      setNextCursor(data.nextCursor);
      setHasMoreMessages(data.hasMore);
    };
    
    socketRef.current.once('messagesPaginated', handleMessageResponse);
    
    // Handle error response
    socketRef.current.once('error', (error) => {
      console.error('Error loading messages:', error);
      cursor ? setIsLoadingMore(false) : setIsChatLoading(false);
      
      // If error is about no messages yet, clear messages
      if (error.type === 'CONVERSATION_NOT_YET') {
        setMessages([]);
        setHasMoreMessages(false);
      }
    });
  };

  // Load more messages (pagination)
  const handleLoadMoreMessages = () => {
    if (hasMoreMessages && nextCursor) {
      loadMessages(nextCursor);
    }
  };

  // Handle selecting a user from search results
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    
    // Check if a chat already exists with this user
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p._id === user._id)
    );
    
    if (existingChat) {
      setCurrentChatId(existingChat._id);
    } else {
      // No existing chat, create a new one by sending initial message
      setCurrentChatId(null);
      setMessages([]);
    }
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

    socketRef.current.emit('sendMessage', messageData);
    
    // If this is a new chat (no currentChatId yet), we wait for the messageSent event
    // which will update the chat list and then set the current chat ID
  };

  // Update a chat message
  const handleUpdateMessage = (messageId, newContent) => {
    if (!newContent.trim()) return;
    
    socketRef.current.emit('updateMessage', {
      messageId: messageId,
      userId: currentUser._id,
      newContent: newContent
    });
  };

  // Delete a chat message
  const handleDeleteMessage = (messageId) => {
    socketRef.current.emit('deleteMessage', {
      messageId,
      userId: currentUser._id
    });
  };

  return (
    <div className="flex min-h-[60vh] bg-gray-100 overflow-hidden">
      {/* Chat Sidebar */}
      <ResizableSidebar ref={sidebarRef}>
        <div className="p-4 bg-purple-100 border-b border-gray-300 flex-shrink-0">
          <h2 className="text-lg font-bold">Chats</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sticky top-0 bg-white z-10 border-b">
            <SearchBar onUserSelect={handleUserSelect} />
          </div>
          
          <div className="flex-1 overflow-y-auto px-2">
            <ChatsSection 
              chats={chats}
              currentUser={currentUser}
              isExpanded={chatExpanded}
              onToggleSection={() => setChatExpanded(!chatExpanded)}
              activeChatId={currentChatId}
              onChatSelect={handleChatSelect}
            />
          </div>
        </div>
      </ResizableSidebar>

      {/* Main chat content area */}
      <div className="flex-1 flex flex-col min-w-[400px]" style={{ height: '100vh' }}>
        {/* Chat Header */}
        {selectedUser && (
          <div className="p-4 bg-white border-b border-gray-300 flex items-center flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold">{selectedUser.user_name}</h2>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
            </div>
          </div>
        )}
        
        {/* Chat Messages Container - Scrollable */}
        <div 
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {/* Load More Messages Button */}
          {hasMoreMessages && (
            <div className="text-center mb-4">
              <button 
                onClick={handleLoadMoreMessages}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                {isLoadingMore ? 'Loading...' : 'Load earlier messages'}
              </button>
            </div>
          )}
          
          {/* Chat Messages */}
          <ChatContent 
            messages={messages}
            currentUser={currentUser}
            selectedUser={selectedUser}
            isLoading={isChatLoading}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={setEditingMessage}
          />
        </div>
        
        {/* Chat Input - Fixed at bottom */}
        {selectedUser && (
          <div className="border-t border-gray-300 bg-white">
            <ChatForm 
              onSendMessage={handleSendMessage}
              onUpdateMessage={handleUpdateMessage}
              editingMessage={editingMessage}
              setEditingMessage={setEditingMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;