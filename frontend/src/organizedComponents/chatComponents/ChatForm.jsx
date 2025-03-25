import React, { useState, useRef, useEffect } from 'react';
import { BiSend, BiPaperclip, BiX, BiCamera, BiMicrophone, BiStopCircle, BiReply } from 'react-icons/bi';

const ChatForm = ({ onSendMessage, onUpdateMessage, editingMessage, setEditingMessage, replyingTo, setReplyingTo }) => {
  const [messageContent, setMessageContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [mimetype, setMimetype] = useState("");
  const [fileName, setFileName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messageInputRef = useRef(null);
  
  // Update content if we're editing a message
  useEffect(() => {
    if (editingMessage) {
      setMessageContent(editingMessage.content || '');
      // Clear any file selection when editing
      resetMediaState();
      // Focus the input field
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
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

  // Handle camera initialization when showCamera changes
  useEffect(() => {
    if (showCamera) {
      initializeCamera();
      // Lock body scroll when camera is shown
      document.body.style.overflow = 'hidden';
    } else {
      stopMediaTracks();
      // Restore scrolling when camera is hidden
      document.body.style.overflow = '';
    }
    
    // Cleanup function
    return () => {
      stopMediaTracks();
      document.body.style.overflow = '';
    };
  }, [showCamera]);

  // Focus the input when replying to a message
  useEffect(() => {
    if (replyingTo && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [replyingTo]);

  // Initialize camera stream
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Force play to start streaming
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing video:", error);
          });
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const stopMediaTracks = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const resetMediaState = () => {
    setMediaFile(null);
    setPreviewUrl(null);
    setFileData(null);
    setMimetype("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if ((!messageContent.trim() && !fileData)) return;
    
    if (editingMessage) {
      // Editing doesn't support file uploads
      onUpdateMessage(editingMessage._id, messageContent.trim());
      setEditingMessage(null);
    } else {
      // Include replyTo ID if replying to a message
      onSendMessage(
        messageContent.trim(), 
        fileData, 
        mimetype, 
        fileName, 
        replyingTo ? replyingTo._id : null
      );
      if (replyingTo) {
        setReplyingTo(null);
      }
    }
    
    // Reset form
    setMessageContent('');
    resetMediaState();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0]; // Get first file
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
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
        setFileName(file.name);
      };
      reader.onerror = (error) => {
        console.error("File conversion error:", error);
      };
    }
  };

  // Camera functionality
  const startCamera = () => {
    setShowCamera(true);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame on canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
          setMediaFile(file);
          setPreviewUrl(URL.createObjectURL(blob));
          setMimetype("image/jpeg");
          setFileName("camera-photo.jpg");
          
          // Convert to base64 for sending
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => {
            setFileData({
              base64: reader.result.split(",")[1],
            });
          };
        }
      }, 'image/jpeg', 0.9);
      
      // Turn off camera
      setShowCamera(false);
    }
  };

  // Audio recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        
        // Create file from blob
        const file = new File([audioBlob], "voice-recording.mp3", { type: "audio/mp3" });
        setMediaFile(file);
        setMimetype("audio/mp3");
        setFileName("voice-recording.mp3");
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onload = () => {
          setFileData({
            base64: reader.result.split(",")[1],
          });
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting audio recording:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="bg-white border-t border-gray-300">
      {/* Full viewport camera view */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <button
              type="button"
              onClick={capturePhoto}
              className="mx-2 p-4 bg-white rounded-full shadow-lg"
            >
              <BiCamera size={28} className="text-purple-600" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCamera(false);
              }}
              className="mx-2 p-4 bg-white rounded-full shadow-lg"
            >
              <BiX size={28} className="text-red-500" />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      {/* Display reply-to message preview */}
      {replyingTo && (
        <div className="p-2 bg-gray-100 border-t border-l-4 border-l-purple-500 flex justify-between items-start">
          <div className="flex-1">
            <div className="text-xs text-purple-600 font-medium mb-1">
              Replying to {replyingTo.sender.user_name || 'message'}
            </div>
            <div className="text-sm text-gray-800 truncate pr-4">
              {replyingTo.content || (replyingTo.media && replyingTo.media.length > 0 ? 'Media message' : 'Message')}
            </div>
          </div>
          <button
            type="button"
            onClick={cancelReply}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <BiX size={18} />
          </button>
        </div>
      )}
      
      {/* Preview area for selected media */}
      {previewUrl && (
        <div className="p-3 relative inline-block">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-32 rounded"
          />
          <button
            type="button"
            onClick={resetMediaState}
            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
          >
            <BiX size={16} />
          </button>
        </div>
      )}
      
      {/* File info for non-image files */}
      {mediaFile && !previewUrl && (
        <div className="mx-3 mt-3 p-2 bg-gray-100 rounded flex justify-between items-center">
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
            onClick={resetMediaState}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            <BiX size={18} />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-center">
          {!editingMessage && !isRecording && (
            <>
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-gray-500 hover:text-purple-700 focus:outline-none"
              >
                <BiPaperclip size={22} />
              </button>
              <button 
                type="button"
                onClick={startCamera}
                className="p-2 text-gray-500 hover:text-purple-700 focus:outline-none"
              >
                <BiCamera size={22} />
              </button>
              <button 
                type="button"
                onClick={startRecording}
                className="p-2 text-gray-500 hover:text-purple-700 focus:outline-none"
              >
                <BiMicrophone size={22} />
              </button>
            </>
          )}
          
          {isRecording && (
            <button 
              type="button"
              onClick={stopRecording}
              className="p-2 text-red-500 hover:text-red-700 focus:outline-none flex items-center"
            >
              <BiStopCircle size={22} className="animate-pulse mr-1" />
              <span className="text-xs">Recording...</span>
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*, video/*, audio/*, application/pdf, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <input
            ref={messageInputRef}
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={editingMessage ? "Edit your message..." : replyingTo ? "Type your reply..." : "Type a message..."}
            className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 mx-2"
          />
          <button 
            type="submit"
            disabled={(!messageContent.trim() && !fileData) || isRecording}
            className={`p-2 rounded-full ${
              (!messageContent.trim() && !fileData) || isRecording
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
    </div>
  );
};

export default ChatForm;