import React, { useState, useRef, useEffect } from 'react';
import { BiSend, BiPaperclip, BiX } from 'react-icons/bi';

const ChatForm = ({ onSendMessage, onUpdateMessage, editingMessage, setEditingMessage }) => {
  const [messageContent, setMessageContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [mimetype, setMimetype] = useState("");
  const fileInputRef = useRef(null);
  
  // Update content if we're editing a message
  useEffect(() => {
    if (editingMessage) {
      setMessageContent(editingMessage.content || '');
      // Clear any file selection when editing
      setMediaFile(null);
      setMimetype(null);
      setPreviewUrl(null);
      setFileData(null);
    }
  }, [editingMessage]);

  // Generate a preview for selected images
  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      return;
    }
    
    // Only generate previews for images
    if (mediaFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(mediaFile);
      setPreviewUrl(objectUrl);
      
      // Clean up the preview URL when component unmounts or when file changes
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [mediaFile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if ((!messageContent.trim() && !fileData)) return;
    
    if (editingMessage) {
      // Editing doesn't support file uploads
      onUpdateMessage(editingMessage._id, messageContent.trim());
      setEditingMessage(null);
    } else {
      onSendMessage(messageContent.trim(), fileData, mimetype);
    }
    
    // Reset form
    setMessageContent('');
    setMediaFile(null);
    setPreviewUrl(null);
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0]; // Get first file
      
      // Check file size (limit to 5MB for example)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }
      
      setMediaFile(file);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setFileData({     
          base64: reader.result.split(",")[1],
        });
        setMimetype(file.type);
      };
      reader.onerror = (error) => {
        console.error("File conversion error:", error);
      };
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-300">
      {/* Preview area for selected media */}
      {previewUrl && (
        <div className="mb-3 relative inline-block">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-32 rounded"
          />
          <button
            type="button"
            onClick={() => {
              setMediaFile(null);
              setPreviewUrl(null);
              setFileData(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
          >
            <BiX size={16} />
          </button>
        </div>
      )}
      
      {/* File info for non-image files */}
      {mediaFile && !previewUrl && (
        <div className="mb-3 p-2 bg-gray-100 rounded flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-2">
              {mediaFile.type.includes('pdf') ? '📄' : 
               mediaFile.type.includes('video') ? '🎥' : 
               mediaFile.type.includes('audio') ? '🎵' : '📎'}
            </span>
            <span className="truncate max-w-xs">{mediaFile.name}</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              setMediaFile(null);
              setFileData(null);
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
          accept="image/*, video/*, audio/*, application/pdf"
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
          disabled={(!messageContent.trim() && !fileData)}
          className={`p-2 rounded-full ${
            (!messageContent.trim() && !fileData) 
              ? 'bg-gray-200 text-gray-400' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          <BiSend size={20} />
        </button>
      </div>
      
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