import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Chat components
import ChatContent from './ChatContent';
import ChatForm from './ChatForm';
import SearchBar from './SearchBar';
import ChatsSection from './ChatSection';
import ResizableSidebar from '../ResizableSidebar';
import notificationSound from "../../assets/sounds/message-notification.mp3";

const ChatPage = ({ userId, userName }) => {
  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  // Reply functionality state
  const [replyingTo, setReplyingTo] = useState(null);
  // For highlighting replied messages
  const [replyToMessageId, setReplyToMessageId] = useState(null);
  
  const socketRef = useRef(null);
  const sidebarRef = useRef(null);
  const messageContainerRef = useRef(null);
  
  // Sound related states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Initialize audio context and load sound
  useEffect(() => {
    // Create audio element as fallback
    audioRef.current = new Audio(notificationSound);
    
    // Try to initialize Web Audio API (more reliable)
    try {
      // Use AudioContext with fallback for older browsers
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const context = new AudioCtx();
        setAudioContext(context);
        
        // Fetch and decode audio file
        fetch(notificationSound)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
          .then(buffer => {
            console.log('Notification sound loaded successfully with Web Audio API');
            setAudioBuffer(buffer);
            setAudioLoaded(true);
          })
          .catch(error => {
            console.warn('Web Audio API loading failed, using HTML5 Audio fallback', error);
            // Set up HTML5 Audio fallback
            setupHtml5AudioFallback();
          });
      } else {
        console.log('Web Audio API not supported, using HTML5 Audio fallback');
        setupHtml5AudioFallback();
      }
    } catch (error) {
      console.warn('Error initializing Web Audio API:', error);
      setupHtml5AudioFallback();
    }
    
    // Cleanup function
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        try {
          audioContext.close();
        } catch (error) {
          console.warn('Error closing AudioContext:', error);
        }
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  // Setup HTML5 Audio fallback
  const setupHtml5AudioFallback = () => {
    if (!audioRef.current) return;
    
    // Preload the audio
    audioRef.current.preload = 'auto';
    
    // Add event listeners
    const handleCanPlayThrough = () => {
      console.log('Notification sound loaded successfully with HTML5 Audio');
      setAudioLoaded(true);
    };
    
    const handleError = (e) => {
      console.error('Error loading notification sound with HTML5 Audio:', e);
      setAudioLoaded(false);
    };
    
    audioRef.current.addEventListener('canplaythrough', handleCanPlayThrough);
    audioRef.current.addEventListener('error', handleError);
    
    // Load the audio
    audioRef.current.load();
    
    // Return cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  };

  // Improved notification sound player with multiple fallbacks
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    // Try to use Web Audio API first (most reliable)
    if (audioContext && audioBuffer && audioLoaded) {
      try {
        // Check if context is suspended (browsers require user interaction)
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            playWithWebAudio();
          }).catch(err => {
            console.warn('Unable to resume AudioContext:', err);
            fallbackToHtml5Audio();
          });
        } else {
          playWithWebAudio();
        }
        return;
      } catch (error) {
        console.warn('Web Audio API playback failed:', error);
        fallbackToHtml5Audio();
      }
    } else {
      fallbackToHtml5Audio();
    }
    
    // HTML5 Audio fallback
    function fallbackToHtml5Audio() {
      if (audioRef.current && audioLoaded) {
        try {
          // Reset audio to beginning
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          // Attempt to play with proper promise handling
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.warn('HTML5 Audio playback failed:', error);
              // Try system notification as last resort
              trySystemNotification();
            });
          }
        } catch (error) {
          console.warn('Error playing HTML5 Audio:', error);
          trySystemNotification();
        }
      } else {
        trySystemNotification();
      }
    }
    
    // Web Audio API playback
    function playWithWebAudio() {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
    
    // System notification fallback (last resort)
    function trySystemNotification() {
      console.log('Falling back to system notification');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New message', { 
          silent: true // We don't want system sound since it might be annoying
        });
      }
    }
  };

  // Toggle notification sound
  const toggleNotificationSound = () => {
    setSoundEnabled(prev => !prev);
  };
  
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
      setIsLoading(false);
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
      console.log("Received message: ", message);
      
      // Check if message belongs to current chat
      const isCurrentChat = selectedUser && (
        (message.sender === selectedUser._id && message.receiver === currentUser._id) ||
        (message.sender === currentUser._id && message.receiver === selectedUser._id)
      );
      
      // Add message to current chat if it belongs there
      if (isCurrentChat) {
        setMessages(prev => [...prev, message]);
      } else if (message.sender !== currentUser._id) {
        // Show notification only if message is from someone else and not in current chat
        showMessageNotification(message);
        
        // Play notification sound
        playNotificationSound();
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

    // Get online users
    socketRef.current.on("getOnlineUsers", (userIds) => {
      console.log("Online users:", userIds);
      setOnlineUsers(userIds);
    });

    socketRef.current.emit("requestOnlineUsers");
    
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
    
    // Chats paginated event
    socketRef.current.on('chatsPaginated', (data) => {
      console.log("chatsPaginated", data);
      setChats(data.chats || []);
      setIsLoading(false);
    });

    // Users paginated event
    socketRef.current.on('usersPaginated', (data) => {
      console.log("usersPaginated", data);
    });
    
    // Cleanup listeners
    return () => {
      socketRef.current.off('receiveMessage');
      socketRef.current.off('messageSent');
      socketRef.current.off('messageUpdated');
      socketRef.current.off('messageDeleted');
      socketRef.current.off('chatsPaginated');
      socketRef.current.off('usersPaginated');
      socketRef.current.off("getOnlineUsers");
    };
  }, [currentUser, selectedUser]);

  // Show notification for new messages
  const showMessageNotification = (message) => {
    // Find the sender's information in the chats
    const senderChat = chats.find(chat => 
      chat.participants.some(p => p._id === message.sender)
    );
    
    let senderName = "New message";
    if (senderChat) {
      // Find the sender participant
      const sender = senderChat.participants.find(p => p._id === message.sender);
      if (sender) {
        senderName = sender.user_name;
      }
    }
    
    // Create a notification using react-toastify
    toast.info(
      <div className="cursor-pointer" onClick={() => navigateToChat(message.sender)}>
        <p className="font-bold">{senderName}</p>
        <p className="text-sm truncate">{message.content || "New message"}</p>
      </div>, 
      {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };
  
  // Navigate to chat when notification is clicked
  const navigateToChat = (userId) => {
    // Find the chat with this user
    const chatWithUser = chats.find(chat => 
      chat.participants.some(p => p._id === userId)
    );
    
    if (chatWithUser) {
      // Find the other user participant
      const otherUser = chatWithUser.participants.find(p => p._id === userId);
      if (otherUser) {
        handleChatSelect(chatWithUser, otherUser);
      }
    }
  };

  // Fetch chats when user is set
  useEffect(() => {
    if (currentUser && socketRef.current) {
      setIsLoading(true);
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
      console.log("message: ", data.messages);
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
      setIsLoading(false);
      cursor ? setIsLoadingMore(false) : setIsChatLoading(false);
      
      // If error is about no messages yet, clear messages
      if (error.type === 'CONVERSATION_NOT_YET') {
        setMessages([]);
        setHasMoreMessages(false);
      }
    });
  };

  // Handle loading more messages
  const handleLoadMoreMessages = () => {
    if (hasMoreMessages && nextCursor) {
      loadMessages(nextCursor);
    }
  };

  // Handle selecting a user from search
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p._id === user._id)
    );
    
    if (existingChat) {
      setCurrentChatId(existingChat._id);
    } else {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  // Handle selecting a chat from the sidebar
  const handleChatSelect = (chat, otherUser) => {
    setSelectedUser(otherUser);
    setCurrentChatId(chat._id);
    setEditingMessage(null);
    setReplyingTo(null); // Clear reply state when changing chats
    setReplyToMessageId(null); // Clear any highlighted message
  };

  // Handle sending a message
  const handleSendMessage = (content, file, mimetype, filename, replyToId) => {
    if ((!content && !file && !mimetype) || !currentUser || !selectedUser) return;
    
    const messageData = {
      sender: currentUser._id,
      receiver: selectedUser._id,
      content: content,
      file: file?.base64,
      mimetype: mimetype,
      filename: filename,
      replyTo: replyToId, // Include reply reference if available
    };

    socketRef.current.emit('sendMessage', messageData);
    
    // Clear reply state after sending
    if (replyToId) {
      setReplyingTo(null);
    }
  };

  // Handle updating a message
  const handleUpdateMessage = (messageId, newContent) => {
    if (!newContent.trim()) return;
    
    socketRef.current.emit('updateMessage', {
      messageId: messageId,
      userId: currentUser._id,
      newContent: newContent
    });
  };

  // Handle deleting a message
  const handleDeleteMessage = (messageId) => {
    socketRef.current.emit('deleteMessage', {
      messageId,
      userId: currentUser._id
    });
  };

  // Handle replying to a message
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    // Focus the input field if needed
    if (messageContainerRef.current) {
      // Scroll to bottom where the input field is
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  // Handle scrolling to a specific message when viewing a reply
  const handleViewReplyToMessage = (messageId) => {
    setReplyToMessageId(messageId);
  };

  return (
    <div className="flex min-h-[60vh] bg-gray-100 overflow-hidden">
      {/* Toast Container for notifications */}
      <ToastContainer />
      
      {/* Chat Sidebar */}
      <ResizableSidebar ref={sidebarRef}>
        <div className="p-4 bg-purple-100 border-b border-gray-300 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Chats</h2>
            {/* Sound toggle button with accurate icon */}
            <button 
              onClick={toggleNotificationSound}
              className="p-2 rounded-full hover:bg-gray-200"
              title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            >
              {soundEnabled ? (
                <span role="img" aria-label="Sound on">🔊</span>
              ) : (
                <span role="img" aria-label="Sound off">🔇</span>
              )}
            </button>
          </div>
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
              isLoading={isLoading}
              onlineUsers={onlineUsers}
            />
          </div>
        </div>
      </ResizableSidebar>

      {/* Main chat content area */}
      <div className="flex-1 flex flex-col min-w-[400px]" style={{ height: '100vh' }}>
        {selectedUser && (
          <div className="p-4 bg-white border-b border-gray-300 flex items-center flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold">{selectedUser.user_name}</h2>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
            </div>
          </div>
        )}
        
        <div 
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
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
          
          <ChatContent 
            messages={messages}
            currentUser={currentUser}
            selectedUser={selectedUser}
            isLoading={isChatLoading}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={setEditingMessage}
            onReplyMessage={handleReplyToMessage}
            replyToMessageId={replyToMessageId}
            setReplyToMessageId={setReplyToMessageId}
          />
        </div>
        
        {selectedUser && (
          <div className="border-t border-gray-300 bg-white">
            <ChatForm 
              onSendMessage={handleSendMessage}
              onUpdateMessage={handleUpdateMessage}
              editingMessage={editingMessage}
              setEditingMessage={setEditingMessage}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;