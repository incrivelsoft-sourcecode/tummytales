import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import PregnancyMap from "./auth/PregnancyMap.js";

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(""); // Track active tab
  const [showPregnancyContent, setShowPregnancyContent] = useState(false);
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
              onClick={() => setActiveTab("home")}
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
              }}
            >
              Pregnancy Map <span className="dropdown-symbol">🔽</span>
            </a>
          </li>
          <li>
            <a
              href="/mom-supporter-network"
              className={activeTab === "mom-support" ? "active-tab" : ""}
              onClick={() => setActiveTab("mom-support")}
            >
              Mom Network
            </a>
          </li>
          <li>
            <a
              href="/ask-ai"
              className={activeTab === "ask-ai" ? "active-tab" : ""}
              onClick={() => setActiveTab("ask-ai")}
            >
              Ask AI
            </a>
          </li>
          <li>
            <a
              href="/resources"
              className={activeTab === "resources" ? "active-tab" : ""}
              onClick={() => setActiveTab("resources")}
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
