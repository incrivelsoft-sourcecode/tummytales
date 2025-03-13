import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";

const AskAI = () => {
    const [message, setMessage] = useState("");
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(Date.now());
    const [chatData, setChatData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error("Please enter a question.", { position: "top-center" });
            return;
        }

        setLoading(true);
        const userMessage = message;
        setMessage("");

        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ai/chat`, { 
                message: `Make the response conversational and human-like: ${userMessage}` 
            });
            const aiResponse = res.data.reply;

            setChatData(prevChatData => ({
                ...prevChatData,
                [currentChatId]: [
                    ...(prevChatData[currentChatId] || []),
                    { question: userMessage, answer: aiResponse }
                ]
            }));

            if (!chats.some(chat => chat.id === currentChatId)) {
                setChats([...chats, { id: currentChatId, name: `Chat ${chats.length + 1}` }]);
            }

            toast.success("AI has responded!", { position: "top-center" });
        } catch (error) {
            toast.error("Error fetching AI response.", { position: "top-center" });
            console.error("Error:", error);
        }
        setLoading(false);
    };

    const handleNewChat = () => {
        setCurrentChatId(Date.now());
    };

    return (
        <div className="flex min-h-screen bg-gray-100 p-4">
            <div className="w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto max-h-screen">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Previous Chats</h3>
                <button onClick={handleNewChat} className="w-full py-2 bg-green-500 text-white font-semibold rounded-md mb-3 hover:bg-green-600">
                    ➕ New Chat
                </button>
                {chats.length === 0 ? (
                    <p className="text-gray-500">No past chats</p>
                ) : (
                    chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setCurrentChatId(chat.id)}
                            className={`p-2 cursor-pointer border-b border-gray-300 hover:bg-gray-200 ${currentChatId === chat.id ? "bg-gray-300" : ""}`}
                        >
                            <p className="text-sm font-medium text-gray-700">{chat.name}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="w-3/4 bg-white p-6 rounded-lg shadow-md ml-4">
                <h2 className="text-2xl font-semibold text-gray-800">Ask AI</h2>
                <p className="text-gray-600">Got a question? Ask it and get answers, perspectives, and recommendations from AI!</p>

                <div className="mt-4 max-h-60 overflow-y-auto">
                    {chatData[currentChatId]?.length === 0 ? (
                        <p className="text-gray-500">Start a conversation...</p>
                    ) : (
                        chatData[currentChatId]?.map((entry, index) => (
                            <div key={index} className="mb-3">
                                <p className="font-semibold text-purple-700">You: {entry.question}</p>
                                <div className="bg-gray-200 p-3 rounded-lg text-gray-800">
                                    🤖 <strong>AI:</strong> <ReactMarkdown>{entry.answer}</ReactMarkdown>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-4 flex items-center border border-gray-300 rounded-lg p-2">
                    <input
                        type="text"
                        className="w-full p-3 outline-none text-gray-800"
                        placeholder="Ask another question..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="ml-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                        disabled={loading}
                    >
                        {loading ? "Thinking..." : "➤"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AskAI;


