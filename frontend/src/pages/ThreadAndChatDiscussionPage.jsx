// IntegratedCommunicationPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router";
import ThreadPage from '../organizedComponents/threadComponents/ThreadPage';
import ChatPage from '../organizedComponents/chatComponents/ChatPage';

const IntegratedCommunicationPage = () => {
  // Common state
  const [activeTab, setActiveTab] = useState('threads'); // 'threads' or 'chats'
  const userId = useMemo(() => localStorage.getItem("userId"), []);
  const userName = useMemo(() => localStorage.getItem("userName"), []);
  const token = useMemo(() => localStorage.getItem("token"), []);
  const navigate = useNavigate();

  // Check for authentication
  // useEffect(() => {
  //   if(!token || !userName || !userId) {
  //     navigate("/");
  //   }
  // }, [token, userName, userId, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-purple-100 border-b border-gray-300 p-4">
        <div className="max-w-7xl mx-auto flex">
          <button 
            className={`mr-2 px-4 py-2 rounded-t-lg ${activeTab === 'threads' ? 'bg-purple-800 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('threads')}
          >
            Threads
          </button>
          <button 
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'chats' ? 'bg-purple-800 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('chats')}
          >
            Chats
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'threads' ? (
          <ThreadPage 
            userId={userId} 
            userName={userName} 
            token={token} 
          />
        ) : (
          <ChatPage 
            userId={userId} 
            userName={userName}
          />
        )}
      </div>
    </div>
  );
};

export default IntegratedCommunicationPage;