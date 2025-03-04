import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import PregnancyMap from "./auth/PregnancyMap.js";
import ChatBox from "./auth/ChatBox.js"; // Import ChatBox component

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(""); // Track active tab
  const [showPregnancyContent, setShowPregnancyContent] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false); // Track Ask AI page
  const pregnancyRef = useRef(null);

  // Close PregnancyMap when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pregnancyRef.current && !pregnancyRef.current.contains(event.target)) {
        setShowPregnancyContent(false);
        setActiveTab(""); // Reset active tab
      }
    };

    if (showPregnancyContent) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPregnancyContent]);

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <ul>
          <li>
            <a
              href="/"
              className={activeTab === "home" ? "active-tab" : ""}
              onClick={() => {
                setActiveTab("home");
                setShowChatBox(false); // Hide Ask AI when clicking Home
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#"
              className={activeTab === "pregnancy" ? "active-tab" : ""}
              onClick={(e) => {
                e.preventDefault();
                setShowPregnancyContent(true);
                setActiveTab("pregnancy");
                setShowChatBox(false); // Hide Ask AI when clicking Pregnancy Map
              }}
            >
              Pregnancy Map <span className="dropdown-symbol">🔽</span>
            </a>
          </li>
          <li>
            <a
              href="/mom-supporter-network"
              className={activeTab === "mom-support" ? "active-tab" : ""}
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
              className={activeTab === "ask-ai" ? "active-tab" : ""}
              onClick={(e) => {
                e.preventDefault();
                setShowChatBox(true); // Show ChatBox when clicking Ask AI
                setActiveTab("ask-ai");
                setShowPregnancyContent(false); // Hide Pregnancy Map
              }}
            >
              Ask AI
            </a>
          </li>
          <li>
            <a
              href="/resources"
              className={activeTab === "resources" ? "active-tab" : ""}
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
        <div className="auth-buttons">
          <button className="start-btn" onClick={() => navigate("/SelectRole")}>
            Sign Up
          </button>
          <button className="start-btn" onClick={() => navigate("/signin")}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Content Below Navbar */}
      <div className="content-below-navbar">
        {showPregnancyContent ? (
          <div ref={pregnancyRef}>
            <PregnancyMap />
          </div>
        ) : showChatBox ? (
          <ChatBox />
        ) : (
          <div className="home-content">
            <h1>Welcome to Our Platform</h1>
            <p>Your journey starts here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
