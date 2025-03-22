import React from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const ChatContent = ({ 
  messages, 
  currentUser, 
  selectedUser,
  isLoading,
  onDeleteMessage,
  onEditMessage
}) => {
  // Format timestamp for messages
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  // Format date for headers
  const formatDateHeader = (timestamp) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy'); // "Monday, January 1, 2025"
    }
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

  // Group messages by date
  const groupedMessages = [];
  let currentDateString = null;

  messages.forEach((message, index) => {
    const messageDate = new Date(message.timestamp);
    const messageDateString = format(messageDate, 'yyyy-MM-dd');
    
    // If this is a new date or the first message, add a date header
    if (messageDateString !== currentDateString) {
      currentDateString = messageDateString;
      
      // Add the date header
      groupedMessages.push({
        type: 'date-header',
        date: messageDate,
        id: `date-${messageDateString}`
      });
    }
    
    // Add the message
    groupedMessages.push({
      type: 'message',
      data: message
    });
  });

  return (
    <div className="flex flex-col space-y-4">
      {groupedMessages.map(item => {
        // Render date header
        if (item.type === 'date-header') {
          return (
            <div key={item.id} className="flex justify-center my-4">
              <div className="bg-gray-200 px-4 py-1 rounded-full text-sm text-gray-600 font-medium">
                {formatDateHeader(item.date)}
              </div>
            </div>
          );
        }
        
        // Render message
        const message = item.data;
        const isCurrentUser = message.sender._id === currentUser._id || message.sender === currentUser._id;
        
        return (
          <div 
            key={message._id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`p-3 rounded-lg shadow-sm max-w-xs md:max-w-md lg:max-w-lg relative group
                ${isCurrentUser 
                  ? 'bg-purple-100 rounded-tr-none' 
                  : 'bg-gray-200 rounded-tl-none'}`}
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
              {isCurrentUser && (
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
        );
      })}
    </div>
  );
};

export default ChatContent;