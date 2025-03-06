import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PregnancyMap from "./auth/PregnancyMap.js";
import ChatBox from "./auth/ChatBox.js";

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");
  const [showPregnancyContent, setShowPregnancyContent] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const pregnancyRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pregnancyRef.current && !pregnancyRef.current.contains(event.target)) {
        setShowPregnancyContent(false);
        setActiveTab("");
      }
    };

    if (showPregnancyContent) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPregnancyContent]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="text-center mt-24 px-4">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-16 py-4 bg-blue-500 shadow-md z-50">
        <ul className="flex gap-52 text-white font-bold text-lg">
          <li>
            <a
              href="/"
              className={`px-4 py-2 ${activeTab === "home" ? "text-yellow-300 underline" : ""}`}
              onClick={() => {
                setActiveTab("home");
                setShowChatBox(false);
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`px-4 py-2 ${activeTab === "pregnancy" ? "text-yellow-300 underline" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setShowPregnancyContent(true);
                setActiveTab("pregnancy");
                setShowChatBox(false);
              }}
            >
              Pregnancy Map <span className="ml-2 text-sm">🔽</span>
            </a>
          </li>
          <li>
            <a
              href="/mom-supporter-network"
              className={`px-4 py-2 ${activeTab === "mom-support" ? "text-yellow-300 underline" : ""}`}
              onClick={() => {
                setActiveTab("mom-support");
                setShowChatBox(false);
              }}
            >
              Mom Network
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`px-4 py-2 ${activeTab === "ask-ai" ? "text-yellow-300 underline" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setShowChatBox(true);
                setActiveTab("ask-ai");
                setShowPregnancyContent(false);
              }}
            >
              Ask AI
            </a>
          </li>
          <li>
            <a
              href="/resources"
              className={`px-4 py-2 ${activeTab === "resources" ? "text-yellow-300 underline" : ""}`}
              onClick={() => {
                setActiveTab("resources");
                setShowChatBox(false);
              }}
            >
              Resources
            </a>
          </li>
        </ul>

        {/* Sign-up & Sign-in Buttons */}
        <div className="flex gap-6">
          {isLoggedIn ? (
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              onClick={() => {
                localStorage.clear();
                navigate("/signin");
              }}
            >
              Sign Out
            </button>
          ) : (
            <button
            className="bg-purple-700 text-white px-6 py-2 rounded-full hover:bg-red-600 transition"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>
          
          )}
        </div>
      </nav>

      {/* Content Below Navbar */}
      <div className="mt-16 px-8 py-8 bg-gray-100 rounded-lg shadow-md mx-auto max-w-2xl">
        {showPregnancyContent ? (
          <div ref={pregnancyRef}>
            <PregnancyMap />
          </div>
        ) : showChatBox ? (
          <ChatBox />
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Our Platform</h1>
            <p className="text-lg text-gray-600">Your journey starts here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
