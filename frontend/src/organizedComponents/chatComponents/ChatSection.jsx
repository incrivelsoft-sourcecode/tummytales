// ChatsSection.jsx
import React, { forwardRef } from 'react';
import ChatItem from './ChatItem';

const ChatsSection = forwardRef(({
  chats = [],
  currentUser,
  isExpanded,
  onToggleSection,
  activeChatId,
  onChatSelect,
  isLoading,
  onlineUsers = []
}, ref) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Process chats to ensure messages are in reverse order (newest first)
  const processedChats = chats.map(chat => {
    if (chat.messages && chat.messages.length > 0) {
      // Create a new chat object with reversed messages array
      return {
        ...chat,
        messages: [...chat.messages].reverse() // Create a new array and reverse it
      };
    }
    return chat;
  });
  
  // Sort chats by the timestamp of their newest message
  const sortedChats = [...processedChats].sort((a, b) => {
    const aLastMessage = a.messages && a.messages.length > 0 ? a.messages[0] : null;
    const bLastMessage = b.messages && b.messages.length > 0 ? b.messages[0] : null;
    
    if (!aLastMessage) return 1; // No messages, put at the end
    if (!bLastMessage) return -1; // Other has no messages
    
    const aTime = aLastMessage.updatedAt || aLastMessage.createdAt;
    const bTime = bLastMessage.updatedAt || bLastMessage.createdAt;
    
    return new Date(bTime) - new Date(aTime); // Newest first
  });
 
  return (
    <div className="mb-4 flex-shrink-0">
      <button
        onClick={onToggleSection}
        className="w-full flex justify-between items-center font-bold text-lg mb-2 text-left hover:text-purple-700 focus:outline-none"
      >
        <span>
          {`Direct Messages (${chats?.length || 0})`}
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
     
      {/* Chats Content */}
      <div
        ref={ref}
        className={`overflow-auto transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-0 max-h-0'}`}
      >
        {!chats || chats.length === 0 ? (
          <p className="text-gray-500 text-sm px-3 py-2">No direct messages yet.</p>
        ) : (
          <ul>
            {sortedChats.map((chat) => (
              <ChatItem
                key={chat._id}
                chat={chat}
                currentUser={currentUser}
                isActive={chat._id === activeChatId}
                onClick={(chat, otherUser) => onChatSelect(chat, otherUser)}
                onlineUsers={onlineUsers}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

export default ChatsSection;