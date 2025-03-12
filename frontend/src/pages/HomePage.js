import React, { useState, useRef, useEffect } from "react";
import PregnancyMap from "./auth/PregnancyMap";
import ChatBox from "./auth/ChatBox";

const Home = ({ setActiveTab }) => {
  const [showPregnancyContent, setShowPregnancyContent] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const pregnancyRef = useRef(null);

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
  }, [showPregnancyContent, setActiveTab]);

  return (
    <div className="text-center mt-24 px-4">
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
