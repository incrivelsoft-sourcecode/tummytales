import React, { useState } from "react";

const AskAmmaPage = () => {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const handleSendMessage = () => {
    if (!message.trim() || currentChatId === null) return;
    const userMessage = { role: "user", content: message };
    const aiMessage = {
      role: "ai",
      content: "This is a placeholder response from Dr. Amma."
    };
    const updatedChats = chats.map((chat, idx) => {
      if (idx === currentChatId) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage, aiMessage]
        };
      }
      return chat;
    });
    setChats(updatedChats);
    setMessage("");
  };

  const handleNewChat = () => {
    setChats([...chats, { name: `Chat ${chats.length + 1}`, messages: [] }]);
    setCurrentChatId(chats.length);
  };

  const handleDeleteChat = (index) => {
    const updatedChats = chats.filter((_, idx) => idx !== index);
    setChats(updatedChats);
    if (index === currentChatId) {
      setCurrentChatId(null);
    } else if (index < currentChatId) {
      setCurrentChatId(currentChatId - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-4 px-6 py-6">
        {/* Left: Chat History */}
        <aside className="col-span-3 bg-white p-4 rounded-lg shadow h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">📜 Previous Chats</h2>
          <button onClick={handleNewChat} className="w-full py-2 mb-4 bg-green-500 text-white rounded hover:bg-green-600">➕ New Chat</button>
          {chats.length === 0 ? (
            <p className="text-gray-500">No chat history</p>
          ) : (
            chats.map((chat, idx) => (
              <div key={idx} className={`p-2 rounded flex justify-between items-center mb-2 ${currentChatId === idx ? "bg-indigo-100" : "hover:bg-gray-100"}`}>
                <button onClick={() => setCurrentChatId(idx)} className="text-left text-sm font-medium text-gray-800 flex-grow">
                  {chat.name}
                </button>
                <button
                  onClick={() => handleDeleteChat(idx)}
                  className="text-red-500 text-xs ml-2 hover:text-red-700"
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </aside>

        {/* Middle: Chat Area */}
        <main className="col-span-6 bg-white p-6 rounded-lg shadow h-[80vh] flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ask Amma</h2>
          <p className="text-gray-600 mb-4">Ask a question and receive a personalized AI response.</p>

          <div className="flex-1 overflow-y-auto mb-4">
            {currentChatId === null || chats[currentChatId]?.messages.length === 0 ? (
              <p className="text-gray-400">Start your conversation...</p>
            ) : (
              chats[currentChatId].messages.map((msg, idx) => (
                <div key={idx} className="mb-4 flex items-start gap-3">
                  {msg.role === "ai" && (
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/3870/3870822.png"
                      alt="Doctor Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${msg.role === "user" ? "text-purple-600" : "text-indigo-700"}`}>{msg.role === "user" ? "You" : "Dr. Amma"}</p>
                    <div className={`px-4 py-2 rounded-lg max-w-xl ${msg.role === "user" ? "bg-indigo-100 text-gray-800" : "bg-gray-200 text-gray-900"}`}>{msg.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="mt-auto">
            <div className="flex">
              <input
                type="text"
                placeholder="Type your question..."
                className="flex-grow p-3 border rounded-l-lg focus:outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={handleSendMessage}
                className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700"
              >
                Send
              </button>
            </div>
          </div>
        </main>

        {/* Right: Toggleable Medical Info Panel */}
        <aside className="col-span-3 bg-white p-4 rounded-lg shadow h-[80vh] overflow-y-auto">
          <button
            className="w-full mb-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            onClick={() => setShowMedicalInfo(!showMedicalInfo)}
          >
            {showMedicalInfo ? "Hide Additional Info" : "Add Additional Info"}
          </button>

          {showMedicalInfo && (
            <div>
              <h3 className="text-lg font-bold mb-4">🩺 Medical Info</h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" className="w-full p-2 border rounded mb-4" />

              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lb)</label>
              <input type="number" className="w-full p-2 border rounded mb-4" />

              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <div className="flex space-x-2 mb-4">
                <input type="number" placeholder="ft" className="w-1/2 p-2 border rounded" />
                <input type="number" placeholder="in" className="w-1/2 p-2 border rounded" />
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
              <textarea className="w-full p-2 border rounded mb-4" rows={3}></textarea>

              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <input type="text" className="w-full p-2 border rounded mb-4" />

              <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
              <input type="text" className="w-full p-2 border rounded mb-4" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AskAmmaPage;

