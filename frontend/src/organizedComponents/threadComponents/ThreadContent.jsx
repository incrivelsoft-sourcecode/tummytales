import React, { useMemo, useState, useRef } from 'react';
import format from "date-fns/format";

const ThreadContent = ({ 
  selectedThread, 
  onDeleteThread, 
  onReplyToThread,
  currentUserId,
  searchTerm
}) => {
  const userName = localStorage.getItem("userName");
  const [selectedFile, setSelectedFile] = useState(null); // State for the attached file
  const [mimetype, setMimetype] = useState(""); // State for the file's MIME type
  const fileInputRef = useRef(null); // Ref for the file input

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return format(date, 'PPp'); // Format as "Jan 1, 2021, 12:00 PM"
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0]; // Get the selected file
      const reader = new FileReader();

      reader.readAsDataURL(file); // Read the file as a base64 string
      reader.onload = () => {
        setSelectedFile({ name: file.name, base64: reader.result.split(",")[1] });
        setMimetype(file.type);
      };

      reader.onerror = (error) => {
        console.error("File conversion error:", error);
      };
    }
  };

  // Handle reply submission
  const handleReplySubmit = (e) => {
    e.preventDefault();
    const content = e.target.elements.replyContent.value;

    if (!content.trim() && !selectedFile) {
      return; // Do not submit if both content and file are empty
    }

    // Call the onReplyToThread function with content and file data
    onReplyToThread(selectedThread._id, content, selectedFile?.base64, mimetype);

    // Reset the form
    e.target.elements.replyContent.value = '';
    setSelectedFile(null);
    setMimetype("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  };

  // Highlight text if it matches search term
  const highlightText = (text, term) => {
    if (!text || !term || term.trim() === '') return text;
    
    // Create regex for exact match with case insensitivity
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    // Replace matches with highlighted spans using dangerouslySetInnerHTML later
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  // Process messages with highlighting if needed
  const processedMessages = useMemo(() => {
    if (!selectedThread?.messages || !searchTerm) return selectedThread?.messages;
    
    return selectedThread.messages.map(message => ({
      ...message,
      highlightedContent: message.content ? highlightText(message.content, searchTerm) : null
    }));
  }, [selectedThread?.messages, searchTerm]);

  if (!selectedThread) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">No thread selected. Click on a thread from the sidebar to view it.</p>
      </div>
    );
  }

  // Use highlightedTitle from thread if available, or highlight it if needed
  const displayTitle = selectedThread.highlightedTitle || 
    (searchTerm ? highlightText(selectedThread.content, searchTerm) : selectedThread.content);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-purple-50">
        <div className="flex justify-between items-start">
          <div>
            {displayTitle && typeof displayTitle === 'string' && displayTitle.includes('<mark') ? (
              <h3 className="font-bold text-lg" dangerouslySetInnerHTML={{ __html: displayTitle }} />
            ) : (
              <h3 className="font-bold text-lg">{displayTitle || selectedThread.content}</h3>
            )}
            <p className="text-sm text-gray-500">
              {selectedThread.creator?.user_name === userName ? "Me" : selectedThread.creator?.user_name || 'Anonymous'} - {formatTimestamp(selectedThread.createdAt)}
            </p>
          </div>
          {currentUserId === selectedThread.creator?._id && (
            <div className="flex">
              <button
                className="text-gray-500 hover:text-gray-700 mr-2"
                onClick={() => {/* Implement edit functionality */ }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => onDeleteThread(selectedThread._id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Display thread media */}
      {selectedThread.media && selectedThread.media.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          {selectedThread.media.map((item, index) => (
            <div key={index} className="mt-2">
              {item.type === 'image' && (
                <img
                  src={item.url}
                  alt="Attached media"
                  className="max-w-xs rounded border border-gray-200"
                />
              )}
              {item.type === 'document' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  {item.format.toUpperCase()} Document
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Thread messages */}
      <div className="p-4">
        {processedMessages && processedMessages.length > 0 ? (
          <div className="space-y-3">
            {processedMessages.map((message) => (
              <div key={message._id} className="flex mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 mr-3">
                  {/* Profile picture placeholder */}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{message.sender?.user_name === userName ? "Me" : message.sender?.user_name || 'Anonymous'}</p>
                  
                  {/* Display message content with highlighting if needed */}
                  {message.highlightedContent ? (
                    <p 
                      className="text-gray-700"
                      dangerouslySetInnerHTML={{ __html: message.highlightedContent }}
                    />
                  ) : (
                    <p className="text-gray-700">{message.content}</p>
                  )}
                  
                  {message.media && message.media.length > 0 && (
                    <div className="mt-2">
                      {message.media.map((item, index) => (
                        <div key={index} className="mt-2">
                          {item.type === 'image' && (
                            <img
                              src={item.url}
                              alt="Attached media"
                              className="max-w-xs rounded border border-gray-200"
                            />
                          )}
                          {item.type === 'document' && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center text-blue-600 hover:underline"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              {item.format.toUpperCase()} Document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{formatTimestamp(message.timestamp || message.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No replies yet. Be the first to respond!</p>
        )}

        {/* Reply form with file attachment */}
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <form
            className="flex flex-col space-y-2"
            onSubmit={handleReplySubmit}
          >
            <textarea
              name="replyContent"
              placeholder="Write your reply..."
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <div className="flex flex-col sm:flex-row justify-between gap-2"></div>
            <div className="flex items-center flex-col sm:flex-row justify-between gap-2">
              <input
                type="file"
                id="replyFileAttachment"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <label
                htmlFor="replyFileAttachment"
                className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Attach File
              </label>
              {selectedFile && (
                <span className="ml-2 text-sm text-gray-600">{selectedFile.name}</span>
              )}
              <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              Reply
            </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default ThreadContent;