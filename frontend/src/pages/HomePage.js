import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import PregnancyMap from "./auth/PregnancyMap.js";  // Import PregnancyMap Component

const Home = () => {
  const navigate = useNavigate();
  const [showPregnancyContent, setShowPregnancyContent] = useState(false);

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <ul>
          <li><a href="/">Home</a></li>
          <li>
            <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setShowPregnancyContent(true);
              }}>
              Pregnancy Map
            </a>
          </li>
          <li><a href="/mom-supporter-network">Mom/Supporter Network</a></li>
          <li><a href="/ask-ai">Ask AI</a></li>
          <li><a href="/resources">Resources</a></li>
        </ul>
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
        {showPregnancyContent ? <PregnancyMap /> : (
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
