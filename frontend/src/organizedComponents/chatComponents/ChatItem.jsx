// ChatItem.jsx
import React from 'react';
import { format } from 'date-fns';

const ChatItem = ({ chat, currentUser, isActive, onClick, onlineUsers = [] }) => {
  console.log("Chats: ", chat);
  // Find the other user in the chat (not the current user)
  const otherUser = chat.participants.find(
    participant => participant._id !== currentUser._id
  );
  
  // Check if the other user is online
  const isOnline = onlineUsers.includes(otherUser._id);
  
  // Get last message if any - now we get the first message in the array since it's the newest
  const lastMessage = chat.messages && chat.messages.length > 0
    ? chat.messages[0] // Get the first message (newest) instead of the last
    : null;
    
  // Format the timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
   
    const messageDate = new Date(timestamp);
    const today = new Date();
   
    // If message is from today, show time only
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'h:mm a');
    }
   
    // If message is from this week, show day name
    const diff = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    if (diff < 7) {
      return format(messageDate, 'EEE');
    }
   
    // Otherwise show date
    return format(messageDate, 'MM/dd/yy');
  };
  
  // Generate message preview
  const getMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';
   
    if (lastMessage.media && lastMessage.media.length > 0) {
      const mediaType = lastMessage.media[0].type;
      if (mediaType === 'image') return '📷 Photo';
      if (mediaType === 'video') return '🎥 Video';
      if (mediaType === 'audio') return '🎵 Audio';
      if (mediaType === 'document') return '📄 Document';
      return '📎 Attachment';
    }
   
    return lastMessage.content || 'Empty message';
  };
  
  return (
    <li
      onClick={() => onClick(chat, otherUser)}
      className={`p-3 hover:bg-gray-100 cursor-pointer transition-colors ${
        isActive ? 'bg-purple-50 border-l-4 border-purple-500' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h3 className="font-medium truncate">{otherUser.user_name}</h3>
            {/* Online status indicator */}
            <div className={`ml-2 w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>
          <p className="text-sm text-gray-600 truncate mt-1">
            {getMessagePreview()}
          </p>
        </div>
        {lastMessage && (
          <div className="flex flex-col items-end ml-2">
            <span className="text-xs text-gray-500">
            {(lastMessage.updatedAt && lastMessage.updatedAt !== lastMessage.createdAt) ? formatTime(lastMessage.updatedAt) : formatTime(lastMessage.createdAt)}
            </span>
            {/* Unread indicator would go here */}
          </div>
        )}
      </div>
    </li>
  );
};

export default ChatItem;
