// ChatContent.jsx
import React, { useEffect, useRef } from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { format } from 'date-fns';

const ChatContent = ({ 
  messages, 
  currentUser, 
  selectedUser,
  isLoading,
  onDeleteMessage,
  onEditMessage
}) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp for messages
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  // Determine message style based on sender
  const getMessageStyle = (message) => {
    const isCurrentUser = message.sender._id === currentUser._id;
    return {
      alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
      backgroundColor: isCurrentUser ? '#e9d5ff' : '#fff', // Light purple for user's messages
      borderRadius: isCurrentUser ? '15px 0 15px 15px' : '0 15px 15px 15px'
    };
  };

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full text-center text-gray-500">
        <div>
          <p className="text-xl mb-2">Select a conversation</p>
          <p>Or search for a user to start chatting</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center text-gray-500">
        <div>
          <p className="text-xl mb-2">No messages yet</p>
          <p>Start the conversation with {selectedUser.user_name}!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      {messages.map(message => (
        <div 
          key={message._id}
          className="mb-4 max-w-3/4 group"
          style={{ 
            display: 'flex',
            justifyContent: getMessageStyle(message).alignSelf === 'flex-end' ? 'flex-end' : 'flex-start'
          }}
        >
          <div 
            className="p-3 inline-block relative shadow-sm"
            style={{ 
              backgroundColor: getMessageStyle(message).backgroundColor,
              borderRadius: getMessageStyle(message).borderRadius,
              maxWidth: '80%'
            }}
          >
            {/* Message content */}
            <div className="mb-1 break-words">{message.content}</div>
            
            {/* Media attachments */}
            {message.media && message.media.length > 0 && (
              <div className="mt-2">
                {message.media.map((item, index) => (
                  <div key={index} className="mt-1">
                    {item.type === 'image' && (
                      <img 
                        src={item.url} 
                        alt="Attachment" 
                        className="max-w-full rounded"
                      />
                    )}
                    {item.type === 'document' && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500"
                      >
                        <span className="mr-1">📄</span>
                        Document {item.format.toUpperCase()}
                      </a>
                    )}
                    {item.type === 'video' && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500"
                      >
                        <span className="mr-1">🎥</span>
                        Video file
                      </a>
                    )}
                    {item.type === 'audio' && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500"
                      >
                        <span className="mr-1">🎵</span>
                        Audio file
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-right mt-1">
              {formatTime(message.timestamp)}
              {message.updatedAt && message.updatedAt !== message.timestamp && ' (edited)'}
            </div>
            
            {/* Message actions - only for current user's messages */}
            {message.sender._id === currentUser._id && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex space-x-1">
                <button 
                  onClick={() => onEditMessage(message)}
                  className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  <BiEdit size={16} />
                </button>
                <button 
                  onClick={() => onDeleteMessage(message._id)}
                  className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  <BiTrash size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContent;