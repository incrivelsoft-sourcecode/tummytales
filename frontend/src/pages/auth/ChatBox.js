import React, { useState, useRef, useEffect } from "react";

const ChatBox = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  const handleSend = () => {
    if (input.trim() === "") return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const botResponse = {
        text: "I'm just a simple chatbot. Ask me anything!",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-[450px] h-[500px] max-w-full bg-gray-100 rounded-xl shadow-md flex flex-col overflow-hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="flex-grow overflow-y-auto p-4 bg-white border-b border-gray-300">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 my-2 max-w-[75%] break-words rounded-lg ${
              msg.sender === "bot"
                ? "bg-gray-200 self-start"
                : "bg-blue-500 text-white self-end"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className=" px-4 py-4 items-center p-3 bg-white border-t border-gray-300">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 text-black border border-gray-300 rounded-full outline-none"
        />
        <button
          onClick={handleSend}
          className="py-4 px-1 bg-red-500 text-white rounded-full text-sm transition duration-300 hover:bg-red-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
