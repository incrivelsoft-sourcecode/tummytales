import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
 
const AskAI = () => {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatData, setChatData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editChatName, setEditChatName] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const user_name = localStorage.getItem("userName") || ""; // Retrieve stored username

console.log("Retrieved user_name:", user_name); 


  useEffect(() => {
    fetchChats();
  }, []);
 
  const fetchChats = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/ai/chats?user_name=${user_name}`
      );
      setChats(res.data.Aichats || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setChats([]);
    }
  };
 
  const handleNewChat = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/ai/chat/new`,
        { user_name }
      );
      const newChat = res.data;
      setChats((prevChats) => [
        ...prevChats,
        { _id: newChat.chatId, name: "New Chat" },
      ]);
      setCurrentChatId(newChat.chatId);
      setChatData({ ...chatData, [newChat.chatId]: [] });
      fetchChats(); // ✅ Auto-refresh the chat list
    } catch (error) {
      toast.error("Failed to create new chat.");
    }
  };
 
  const handleChatSelection = async (chatId) => {
    setCurrentChatId(chatId);
    if (!chatData[chatId]) {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/ai/chat/${chatId}?user_name=${user_name}`
        );
        setChatData((prevChatData) => ({
          ...prevChatData,
          [chatId]: res.data.messages || [],
        }));
      } catch (error) {
        console.error("Error loading chat messages:", error);
      }
    }
  };
 
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a question.");
      return;
    }
 
    setLoading(true);
    const userMessage = message;
    setMessage("");
 
    try {
      let chatId = currentChatId;
 
      // ✅ If no chat is selected, create a new one
      if (!chatId) {
        const newChatRes = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/ai/chat/new`,
          { user_name }
        );
        chatId = newChatRes.data.chatId; // Get new chat ID from response
        setCurrentChatId(chatId);
        setChats((prevChats) => [
          ...prevChats,
          { _id: chatId, name: "New Chat" },
        ]);
        setChatData((prevChatData) => ({
          ...prevChatData,
          [chatId]: [],
        }));
      }
 
      // ✅ Send message using either existing or newly created chat
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/ai/chat`,
        {
          message: userMessage,
          chatId,
          user_name 
        }
      );
 
      const aiResponse = res.data.reply;
 
      setChatData((prevChatData) => ({
        ...prevChatData,
        [chatId]: [
          ...(prevChatData[chatId] || []),
          { question: userMessage, answer: aiResponse },
        ],
      }));
 
      toast.success("AI has responded!");
      fetchChats(); // ✅ Refresh chats list
    } catch (error) {
      toast.error("Error fetching AI response.");
    }
   
    setLoading(false);
  };
 
 
  const handleEditChat = async (chatId) => {
    // Find the current chat name before editing
    const originalChat = chats.find((chat) => chat._id === chatId);
 
    // Prevent API call if name hasn't changed
    if (!originalChat || originalChat.name === editChatName.trim()) {
      setEditingChatId(null);
      setMenuOpen(null);
      return; // Exit function without updating
    }
 
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/ai/ai/chat/${chatId}`,
        { name: editChatName,
          user_name
         }
      );
 
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === chatId ? { ...chat, name: editChatName } : chat
        )
      );
      setEditingChatId(null);
      setMenuOpen(null);
      toast.success("Chat name updated!");
    } catch (error) {
      toast.error("Failed to update chat name.");
    }
  };
 
 
  //
 
  const handleDeleteChat = async () => {
    if (!confirmDelete) return; // Ensure a chat is selected
 
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/ai/chat/${confirmDelete}?user_name=${user_name}`
      );
      setChats((prevChats) =>
        prevChats.filter((chat) => chat._id !== confirmDelete)
      );
      if (currentChatId === confirmDelete) {
        setCurrentChatId(null);
      }
      setMenuOpen(null);
      toast.success("Chat deleted!");
    } catch (error) {
      toast.error("Failed to delete chat.");
    }
 
    setConfirmDelete(null); 
  };
 
  return (
    <div className="flex min-h-screen bg-gray-100 p-4">
      {/* Sidebar with Chats */}
      <div className="w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto max-h-screen">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Previous Chats
        </h3>
        <button
          onClick={handleNewChat}
          className="w-full py-2 bg-green-500 text-white font-semibold rounded-md mb-3 hover:bg-green-600"
        >
          ➕ New Chat
        </button>
        {chats.length === 0 ? (
          <p className="text-gray-500">No past chats</p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              className={`p-2 cursor-pointer border-b border-gray-300 flex justify-between items-center ${
                currentChatId === chat._id ? "bg-gray-300" : "hover:bg-gray-200"
              }`}
            >
              {editingChatId === chat._id ? (
                <input
                  type="text"
                  value={editChatName}
                  onChange={(e) => setEditChatName(e.target.value)}
                  onBlur={() => handleEditChat(chat._id)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleEditChat(chat._id)
                  }
                  className="border p-1 text-sm w-32"
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm font-medium text-gray-700 flex-1"
                  onClick={() => handleChatSelection(chat._id)}
                >
                  {chat.name || "New Chat"}
                </p>
              )}
              <div className="relative">
                <button
                  onClick={() =>
                    setMenuOpen(menuOpen === chat._id ? null : chat._id)
                  }
                  className="text-gray-600 hover:text-gray-800"
                >
                  ⋮
                </button>
                {menuOpen === chat._id && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        setEditingChatId(chat._id);
                        setEditChatName(chat.name);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(chat._id)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-100"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
 
      {/* Main Chat Area */}
      <div className="w-3/4 bg-white p-6 rounded-lg shadow-md ml-4 flex flex-col h-screen">
        <h2 className="text-2xl font-semibold text-gray-800">Ask AI</h2>
        <p className="text-gray-600">
          Got a question? Ask it and get AI-powered answers!
        </p>
 
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mt-4">
          {chatData[currentChatId]?.length === 0 ? (
            <p className="text-gray-500">Start a conversation...</p>
          ) : (
            chatData[currentChatId]?.map((entry, index) => (
              <div key={index} className="mb-3">
                <p className="font-semibold text-purple-700">
                  You: {entry.question}
                </p>
                <div className="bg-gray-200 p-3 rounded-lg text-gray-800">
                  🤖 <strong>AI:</strong>{" "}
                  <ReactMarkdown>{entry.answer}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
        </div>
 
        {/* Input Box (Fixed at Bottom) */}
        <div className="p-4 border-t border-gray-300 bg-gray-50 sticky bottom-0">
          <div className="flex items-center border border-gray-400 rounded-lg bg-gray-100 p-2">
            <input
              type="text"
              className="w-full p-3 outline-none text-gray-800 bg-white rounded-md"
              placeholder="Ask another question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              onClick={handleSendMessage}
              className="ml-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-purple-800 hover:to-indigo-800 transition shadow-md"
              disabled={loading}
            >
              {loading ? "Thinking..." : "➤"}
            </button>
          </div>
        </div>
      </div>
 
      {/* Delete Confirmation Modal (Placed Correctly Inside Return) */}
      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">
              Are you sure you want to delete this chat?
            </p>
            <div className="mt-4">
              <button
                onClick={handleDeleteChat}
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default AskAI;






// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import ReactMarkdown from "react-markdown";

// const AskAI = () => {
//   const [message, setMessage] = useState("");
//   const [chats, setChats] = useState([]);
//   const [currentChatId, setCurrentChatId] = useState(null);
//   const [chatData, setChatData] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [editingChatId, setEditingChatId] = useState(null);
//   const [editChatName, setEditChatName] = useState("");

//   useEffect(() => {
//     fetchChats();
//   }, []);

//   const fetchChats = async () => {
//     try {
//       const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ai/chats`);
//       setChats(res.data.Aichats || []);
//     } catch (error) {
//       console.error("Error fetching chats:", error);
//       setChats([]);
//     }
//   };

//   const handleNewChat = async () => {
//     try {
//       const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ai/chat/new`);
//       const newChat = res.data;
//       setChats((prevChats) => [...prevChats, { _id: newChat.chatId, name: "New Chat" }]);
//       setCurrentChatId(newChat.chatId);
//       setChatData({ ...chatData, [newChat.chatId]: [] });
//     } catch (error) {
//       toast.error("Failed to create new chat.");
//     }
//   };

//   const handleChatSelection = async (chatId) => {
//     setCurrentChatId(chatId);
//     if (!chatData[chatId]) {
//       try {
//         const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ai/chat/${chatId}`);
//         setChatData((prevChatData) => ({
//           ...prevChatData,
//           [chatId]: res.data.messages || [],
//         }));
//       } catch (error) {
//         console.error("Error loading chat messages:", error);
//       }
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!message.trim()) {
//       toast.error("Please enter a question.");
//       return;
//     }

//     setLoading(true);
//     const userMessage = message;
//     setMessage("");

//     try {
//       const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ai/chat`, {
//         message: userMessage,
//         chatId: currentChatId,
//       });

//       const aiResponse = res.data.reply;

//       setChatData((prevChatData) => ({
//         ...prevChatData,
//         [currentChatId]: [
//           ...(prevChatData[currentChatId] || []),
//           { question: userMessage, answer: aiResponse },
//         ],
//       }));

//       toast.success("AI has responded!");
//     } catch (error) {
//       toast.error("Error fetching AI response.");
//     }
//     setLoading(false);
//   };

//   // Edit chat name logic
//   const handleEditChat = async (chatId) => {
//     try {
//       await axios.put(`${process.env.REACT_APP_BACKEND_URL}/ai/chat/${chatId}`, { name: editChatName });

//       setChats((prevChats) =>
//         prevChats.map((chat) => (chat._id === chatId ? { ...chat, name: editChatName } : chat))
//       );

//       setEditingChatId(null);
//       toast.success("Chat name updated!");
//     } catch (error) {
//       toast.error("Failed to update chat name.");
//     }
//   };

//   // Delete chat logic
//   const handleDeleteChat = async (chatId) => {
//     if (!window.confirm("Are you sure you want to delete this chat?")) return;

//     try {
//       await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/ai/chat/${chatId}`);

//       setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));

//       if (currentChatId === chatId) {
//         setCurrentChatId(null);
//       }

//       toast.success("Chat deleted!");
//     } catch (error) {
//       toast.error("Failed to delete chat.");
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100 p-4">
//       {/* Sidebar: Previous Chats */}
//       <div className="w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto max-h-screen">
//         <h3 className="text-lg font-semibold text-gray-800 mb-2">Previous Chats</h3>
//         <button
//           onClick={handleNewChat}
//           className="w-full py-2 bg-green-500 text-white font-semibold rounded-md mb-3 hover:bg-green-600"
//         >
//           ➕ New Chat
//         </button>

//         {chats.length === 0 ? (
//           <p className="text-gray-500">No past chats</p>
//         ) : (
//           [...chats]
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//             .map((chat) => (
//               <div
//                 key={chat._id}
//                 className={`p-2 cursor-pointer border-b border-gray-300 flex justify-between items-center ${
//                   currentChatId === chat._id ? "bg-gray-300" : "hover:bg-gray-200"
//                 }`}
//               >
//                 {/* Chat Name or Editable Input */}
//                 {editingChatId === chat._id ? (
//                   <input
//                     type="text"
//                     value={editChatName}
//                     onChange={(e) => setEditChatName(e.target.value)}
//                     onBlur={() => handleEditChat(chat._id)}
//                     onKeyDown={(e) => e.key === "Enter" && handleEditChat(chat._id)}
//                     className="border p-1 text-sm w-32"
//                     autoFocus
//                   />
//                 ) : (
//                   <p
//                     className="text-sm font-medium text-gray-700 flex-1"
//                     onClick={() => handleChatSelection(chat._id)}
//                   >
//                     {chat.name || "New Chat"}
//                   </p>
//                 )}

//                 {/* Edit and Delete Icons */}
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => {
//                       setEditingChatId(chat._id);
//                       setEditChatName(chat.name);
//                     }}
//                     className="text-blue-500 hover:text-blue-700 text-sm"
//                   >
//                     ✏️
//                   </button>
//                   <button
//                     onClick={() => handleDeleteChat(chat._id)}
//                     className="text-red-500 hover:text-red-700 text-sm"
//                   >
//                     🗑️
//                   </button>
//                 </div>
//               </div>
//             ))
//         )}
//       </div>

//       {/* Chat Display */}
//       <div className="w-3/4 bg-white p-6 rounded-lg shadow-md ml-4">
//         <h2 className="text-2xl font-semibold text-gray-800">Ask AI</h2>
//         <p className="text-gray-600">Got a question? Ask it and get AI-powered answers!</p>

//         <div className="mt-4 max-h-60 overflow-y-auto">
//           {chatData[currentChatId]?.length === 0 ? (
//             <p className="text-gray-500">Start a conversation...</p>
//           ) : (
//             chatData[currentChatId]?.map((entry, index) => (
//               <div key={index} className="mb-3">
//                 <p className="font-semibold text-purple-700">You: {entry.question}</p>
//                 <div className="bg-gray-200 p-3 rounded-lg text-gray-800">
//                   🤖 <strong>AI:</strong> <ReactMarkdown>{entry.answer}</ReactMarkdown>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Input Box */}
//         <div className="mt-4 flex items-center border border-gray-300 rounded-lg p-2">
//           <input
//             type="text"
//             className="w-full p-3 outline-none text-gray-800"
//             placeholder="Ask another question..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//           />
//           <button
//             onClick={handleSendMessage}
//             className="ml-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
//             disabled={loading}
//           >
//             {loading ? "Thinking..." : "➤"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AskAI;

//main(latest)
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import ReactMarkdown from "react-markdown";

// const AskAI = () => {
//   const [message, setMessage] = useState("");
//   const [chats, setChats] = useState([]);
//   const [currentChatId, setCurrentChatId] = useState(null);
//   const [chatData, setChatData] = useState({});
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchChats();
//   }, []);

//   const fetchChats = async () => {
//     try {
//       const res = await axios.get(
//         `${process.env.REACT_APP_BACKEND_URL}/ai/chats`
//       );
//       const chatList = res.data.Aichats || [];
//       setChats(chatList);
//     } catch (error) {
//       console.error("Error fetching chats:", error);
//       setChats([]);
//     }
//   };

//   const handleNewChat = async () => {
//     try {
//       const res = await axios.post(
//         `${process.env.REACT_APP_BACKEND_URL}/ai/chat/new`
//       );
//       const newChat = res.data;
//       //setChats([...chats, { _id: newChat.chatId, name: newChat.name }]);
//       setChats((prevChats) => [...prevChats, { _id: newChat.chatId, name: "New Chat" }]);
//       setCurrentChatId(newChat.chatId);
//       setChatData({ ...chatData, [newChat.chatId]: [] });
//     } catch (error) {
//       toast.error("Failed to create new chat.");
//       console.error("Error creating new chat:", error);
//     }
//   };

//   const handleChatSelection = async (chatId) => {
//     setCurrentChatId(chatId);

//     if (!chatData[chatId]) {
//       try {
//         const res = await axios.get(
//           `${process.env.REACT_APP_BACKEND_URL}/ai/chat/${chatId}`
//         );
//         setChatData((prevChatData) => ({
//           ...prevChatData,
//           [chatId]: res.data.messages || [],
//         }));
//       } catch (error) {
//         console.error("Error loading chat messages:", error);
//       }
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!message.trim()) {
//       toast.error("Please enter a question.");
//       return;
//     }

//     setLoading(true);
//     const userMessage = message;
//     setMessage("");

//     try {
//       const res = await axios.post(
//         `${process.env.REACT_APP_BACKEND_URL}/ai/chat`,
//         { message: userMessage, chatId: currentChatId }
//       );

//       const { reply, chatName } = res.data;

//       setChatData((prevChatData) => ({
//         ...prevChatData,
//         [currentChatId]: [
//           ...(prevChatData[currentChatId] || []),
//           { question: userMessage, answer: reply },
//         ],
//       }));

//       // Update chat name if this is the first message
//       setChats((prevChats) =>
//         prevChats.map((chat) =>
//           chat._id === currentChatId ? { ...chat, name: chatName } : chat
//         )
//       );

//       toast.success("AI has responded!");
//     } catch (error) {
//       toast.error("Error fetching AI response.");
//       console.error("Error:", error);
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100 p-4">
//       <div className="w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto max-h-screen">
//         <h3 className="text-lg font-semibold text-gray-800 mb-2">
//           Previous Chats
//         </h3>
//         <button
//           onClick={handleNewChat}
//           className="w-full py-2 bg-green-500 text-white font-semibold rounded-md mb-3 hover:bg-green-600"
//         >
//           ➕ New Chat
//         </button>
//         {/* {chats.length === 0 ? (
//                     <p className="text-gray-500">No past chats</p>
//                 ) : (
//                     chats.map(chat => (
//                         <div
//                             key={chat._id}
//                             onClick={() => handleChatSelection(chat._id)}
//                             className={`p-2 cursor-pointer border-b border-gray-300 hover:bg-gray-200 ${currentChatId === chat._id ? "bg-gray-300" : ""}`}
//                         >
//                             <p className="text-sm font-medium text-gray-700">{chat.name}</p>
//                         </div>
//                     ))
//                 )} */}
//         {chats.length === 0 ? (
//           <p className="text-gray-500">No past chats</p>
//         ) : (
//           [...chats]
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // ✅ Ensure newest first
//             .map((chat) => (
//               <div
//                 key={chat._id}
//                 onClick={() => handleChatSelection(chat._id)}
//                 className={`p-2 cursor-pointer border-b border-gray-300 hover:bg-gray-200 ${
//                   currentChatId === chat._id ? "bg-gray-300" : ""
//                 }`}
//               >
//                 <p className="text-sm font-medium text-gray-700">
//                   {chat.name || "New Chat"}
//                 </p>
//               </div>
//             ))
//         )}
//       </div>

//       <div className="w-3/4 bg-white p-6 rounded-lg shadow-md ml-4">
//         <h2 className="text-2xl font-semibold text-gray-800">Ask AI</h2>
//         <p className="text-gray-600">
//           Got a question? Ask it and get answers, perspectives, and
//           recommendations from AI!
//         </p>

//         <div className="mt-4 max-h-60 overflow-y-auto">
//           {chatData[currentChatId]?.length === 0 ? (
//             <p className="text-gray-500">Start a conversation...</p>
//           ) : (
//             chatData[currentChatId]?.map((entry, index) => (
//               <div key={index} className="mb-3">
//                 <p className="font-semibold text-purple-700">
//                   You: {entry.question}
//                 </p>
//                 <div className="bg-gray-200 p-3 rounded-lg text-gray-800">
//                   🤖 <strong>AI:</strong>{" "}
//                   <ReactMarkdown>{entry.answer}</ReactMarkdown>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         <div className="mt-4 flex items-center border border-gray-300 rounded-lg p-2">
//           <input
//             type="text"
//             className="w-full p-3 outline-none text-gray-800"
//             placeholder="Ask another question..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//           />
//           <button
//             onClick={handleSendMessage}
//             className="ml-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
//             disabled={loading}
//           >
//             {loading ? "Thinking..." : "➤"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AskAI;

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import ReactMarkdown from "react-markdown";

// const AskAI = () => {
//   const [message, setMessage] = useState("");
//   const [chats, setChats] = useState([]);
//   const [currentChatId, setCurrentChatId] = useState(null);
//   const [chatData, setChatData] = useState({});
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchChats();
//   }, []);

//   const fetchChats = async () => {
//     try {
//       const res = await axios.get(
//         `${process.env.REACT_APP_BACKEND_URL}/ai/chats`
//       );
//       const chatList = res.data.Aichats || [];
//       setChats(chatList);
//     } catch (error) {
//       console.error("Error fetching chats:", error);
//       setChats([]);
//     }
//   };

//   const handleNewChat = async () => {
//     try {
//       const res = await axios.post(
//         `${process.env.REACT_APP_BACKEND_URL}/ai/chat/new`
//       );
//       const newChat = res.data;
//       setChats([...chats, { _id: newChat.chatId, name: newChat.name }]);
//       setCurrentChatId(newChat.chatId);
//       setChatData({ ...chatData, [newChat.chatId]: [] });
//     } catch (error) {
//       toast.error("Failed to create new chat.");
//       console.error("Error creating new chat:", error);
//     }
//   };

//   const handleChatSelection = async (chatId) => {
//     setCurrentChatId(chatId);

//     if (!chatData[chatId]) {
//       try {
//         const res = await axios.get(
//           `${process.env.REACT_APP_BACKEND_URL}/ai/chat/${chatId}`
//         );
//         setChatData((prevChatData) => ({
//           ...prevChatData,
//           [chatId]: res.data.messages || [],
//         }));
//       } catch (error) {
//         console.error("Error loading chat messages:", error);
//       }
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!message.trim()) {
//       toast.error("Please enter a question.");
//       return;
//     }

//     setLoading(true);
//     const userMessage = message;
//     setMessage("");

//     try {
//       const res = await axios.post(
//         `${process.env.REACT_APP_BACKEND_URL}/ai/chat`,
//         {
//           message: userMessage,
//           chatId: currentChatId,
//         }
//       );

//       const aiResponse = res.data.reply;

//       setChatData((prevChatData) => ({
//         ...prevChatData,
//         [currentChatId]: [
//           ...(prevChatData[currentChatId] || []),
//           { question: userMessage, answer: aiResponse },
//         ],
//       }));

//       toast.success("AI has responded!");
//     } catch (error) {
//       toast.error("Error fetching AI response.");
//       console.error("Error:", error);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100 p-4">
//       <div className="w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto max-h-screen">
//         <h3 className="text-lg font-semibold text-gray-800 mb-2">
//           Previous Chats
//         </h3>
//         <button
//           onClick={handleNewChat}
//           className="w-full py-2 bg-green-500 text-white font-semibold rounded-md mb-3 hover:bg-green-600"
//         >
//           ➕ New Chat
//         </button>
//         {/* {chats.length === 0 ? (
//                     <p className="text-gray-500">No past chats</p>
//                 ) : (
//                     chats.map(chat => (
//                         <div
//                             key={chat._id}
//                             onClick={() => handleChatSelection(chat._id)}
//                             className={`p-2 cursor-pointer border-b border-gray-300 hover:bg-gray-200 ${currentChatId === chat._id ? "bg-gray-300" : ""}`}
//                         >
//                             <p className="text-sm font-medium text-gray-700">{chat.name}</p>
//                         </div>
//                     ))
//                 )} */}
//         {chats.length === 0 ? (
//           <p className="text-gray-500">No past chats</p>
//         ) : (
//           [...chats]
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // ✅ Ensure newest first
//             .map((chat) => (
//               <div
//                 key={chat._id}
//                 onClick={() => handleChatSelection(chat._id)}
//                 className={`p-2 cursor-pointer border-b border-gray-300 hover:bg-gray-200 ${
//                   currentChatId === chat._id ? "bg-gray-300" : ""
//                 }`}
//               >
//                 <p className="text-sm font-medium text-gray-700">
//                   {chat.name || "New Chat"}
//                 </p>
//               </div>
//             ))
//         )}
//       </div>

//       <div className="w-3/4 bg-white p-6 rounded-lg shadow-md ml-4">
//         <h2 className="text-2xl font-semibold text-gray-800">Ask AI</h2>
//         <p className="text-gray-600">
//           Got a question? Ask it and get answers, perspectives, and
//           recommendations from AI!
//         </p>

//         <div className="mt-4 max-h-60 overflow-y-auto">
//           {chatData[currentChatId]?.length === 0 ? (
//             <p className="text-gray-500">Start a conversation...</p>
//           ) : (
//             chatData[currentChatId]?.map((entry, index) => (
//               <div key={index} className="mb-3">
//                 <p className="font-semibold text-purple-700">
//                   You: {entry.question}
//                 </p>
//                 <div className="bg-gray-200 p-3 rounded-lg text-gray-800">
//                   🤖 <strong>AI:</strong>{" "}
//                   <ReactMarkdown>{entry.answer}</ReactMarkdown>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         <div className="mt-4 flex items-center border border-gray-300 rounded-lg p-2">
//           <input
//             type="text"
//             className="w-full p-3 outline-none text-gray-800"
//             placeholder="Ask another question..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//           />
//           <button
//             onClick={handleSendMessage}
//             className="ml-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
//             disabled={loading}
//           >
//             {loading ? "Thinking..." : "➤"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AskAI;

// import React, { useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import ReactMarkdown from "react-markdown";

// const AskAI = () => {
//     const [message, setMessage] = useState("");
//     const [chats, setChats] = useState([]);
//     const [currentChatId, setCurrentChatId] = useState(Date.now());
//     const [chatData, setChatData] = useState({});
//     const [loading, setLoading] = useState(false);

//     const handleSendMessage = async () => {
//         if (!message.trim()) {
//             toast.error("Please enter a question.", { position: "top-center" });
//             return;
//         }

//         setLoading(true);
//         const userMessage = message;
//         setMessage("");

//         try {
//             const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ai/chat`, {
//                 message: `Make the response conversational and human-like: ${userMessage}`
//             });
//             const aiResponse = res.data.reply;

//             setChatData(prevChatData => ({
//                 ...prevChatData,
//                 [currentChatId]: [
//                     ...(prevChatData[currentChatId] || []),
//                     { question: userMessage, answer: aiResponse }
//                 ]
//             }));

//             if (!chats.some(chat => chat.id === currentChatId)) {
//                 setChats([...chats, { id: currentChatId, name: `Chat ${chats.length + 1}` }]);
//             }

//             toast.success("AI has responded!", { position: "top-center" });
//         } catch (error) {
//             toast.error("Error fetching AI response.", { position: "top-center" });
//             console.error("Error:", error);
//         }
//         setLoading(false);
//     };

//     const handleNewChat = () => {
//         setCurrentChatId(Date.now());
//     };

//     return (
//         <div className="flex min-h-screen bg-gray-100 p-4">
//             <div className="w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto max-h-screen">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-2">Previous Chats</h3>
//                 <button onClick={handleNewChat} className="w-full py-2 bg-green-500 text-white font-semibold rounded-md mb-3 hover:bg-green-600">
//                     ➕ New Chat
//                 </button>
//                 {chats.length === 0 ? (
//                     <p className="text-gray-500">No past chats</p>
//                 ) : (
//                     chats.map(chat => (
//                         <div
//                             key={chat.id}
//                             onClick={() => setCurrentChatId(chat.id)}
//                             className={`p-2 cursor-pointer border-b border-gray-300 hover:bg-gray-200 ${currentChatId === chat.id ? "bg-gray-300" : ""}`}
//                         >
//                             <p className="text-sm font-medium text-gray-700">{chat.name}</p>
//                         </div>
//                     ))
//                 )}
//             </div>

//             <div className="w-3/4 bg-white p-6 rounded-lg shadow-md ml-4">
//                 <h2 className="text-2xl font-semibold text-gray-800">Ask AI</h2>
//                 <p className="text-gray-600">Got a question? Ask it and get answers, perspectives, and recommendations from AI!</p>

//                 <div className="mt-4 max-h-60 overflow-y-auto">
//                     {chatData[currentChatId]?.length === 0 ? (
//                         <p className="text-gray-500">Start a conversation...</p>
//                     ) : (
//                         chatData[currentChatId]?.map((entry, index) => (
//                             <div key={index} className="mb-3">
//                                 <p className="font-semibold text-purple-700">You: {entry.question}</p>
//                                 <div className="bg-gray-200 p-3 rounded-lg text-gray-800">
//                                     🤖 <strong>AI:</strong> <ReactMarkdown>{entry.answer}</ReactMarkdown>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>

//                 <div className="mt-4 flex items-center border border-gray-300 rounded-lg p-2">
//                     <input
//                         type="text"
//                         className="w-full p-3 outline-none text-gray-800"
//                         placeholder="Ask another question..."
//                         value={message}
//                         onChange={(e) => setMessage(e.target.value)}
//                     />
//                     <button
//                         onClick={handleSendMessage}
//                         className="ml-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
//                         disabled={loading}
//                     >
//                         {loading ? "Thinking..." : "➤"}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AskAI;
