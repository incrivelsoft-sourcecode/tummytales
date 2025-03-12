// ChatForm.jsx
import React, { useState, useRef } from 'react';
import { BiSend, BiPaperclip, BiX } from 'react-icons/bi';

const ChatForm = ({ onSendMessage, onUpdateMessage, editingMessage, setEditingMessage }) => {
  const [messageContent, setMessageContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Update content if we're editing a message
  React.useEffect(() => {
    if (editingMessage) {
      setMessageContent(editingMessage.content || '');
    }
  }, [editingMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if ((!messageContent.trim() && !mediaFile)) return;
    
    if (editingMessage) {
      onUpdateMessage(editingMessage._id, messageContent.trim());
      setEditingMessage(null);
    } else {
      onSendMessage(messageContent.trim(), mediaFile);
    }
    
    // Reset form
    setMessageContent('');
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setMediaFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-300">
      <div className="flex items-center">
        {!editingMessage && (
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-2 text-gray-500 hover:text-purple-700 focus:outline-none"
          >
            <BiPaperclip size={22} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
          className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 mx-2"
        />
        <button 
          type="submit"
          disabled={(!messageContent.trim() && !mediaFile)}
          className={`p-2 rounded-full ${
            (!messageContent.trim() && !mediaFile) 
              ? 'bg-gray-200 text-gray-400' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          <BiSend size={20} />
        </button>
      </div>
      
      {/* Selected file preview */}
      {mediaFile && (
        <div className="mt-2 p-2 bg-gray-100 rounded flex justify-between items-center">
          <span className="truncate text-sm">{mediaFile.name}</span>
          <button 
            type="button"
            onClick={() => {
              setMediaFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            <BiX size={18} />
          </button>
        </div>
      )}
      
      {/* Editing indicator */}
      {editingMessage && (
        <div className="mt-2 text-xs text-purple-500 flex justify-between">
          <span>Editing message...</span>
          <button 
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setMessageContent('');
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
};

export default ChatForm;