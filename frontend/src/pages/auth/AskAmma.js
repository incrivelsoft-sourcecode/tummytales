import React from "react";
import { useNavigate } from "react-router-dom";

const AskAmmaPage = () => {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <div className="min-h-screen bg-[#F3E6B8] flex flex-col md:flex-row items-center justify-center px-6 py-12 md:px-12 lg:px-20">
      {/* Left Section (Image) */}
      <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
        <div className="relative w-full max-w-sm md:max-w-md lg:max-w-lg h-72 md:h-80 lg:h-96 overflow-hidden rounded-2xl shadow-xl">
          <img
            src="askammaimage.jpg"
            alt="Ask Amma Illustration"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Section (Text) */}
      <div className="w-full md:w-1/2 flex flex-col items-start space-y-6 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
          Ask Amma
        </h1>

        <div className="space-y-4 text-gray-700 text-base md:text-lg lg:text-xl leading-relaxed">
          <p>
            Meet Ask Amma - your trusted AI assistant for all pregnancy-related questions! 
            Whether you're looking for expert-backed advice, cultural insights, or just a little reassurance.
          </p>
          <p>
            Amma is here to provide detailed, personalized answers whenever you need them. Give it a try!
          </p>
        </div>

        {/* Button with Navigation */}
        <button
          onClick={() => navigate("/ask-ai")} // Navigate to Ask AI page
          className="mt-4 px-6 py-3 bg-[#BFC491] text-gray-800 font-semibold text-base md:text-lg rounded-lg hover:bg-[#A8B37D] transition duration-300 shadow-md"
        >
          Get started!
        </button>
      </div>
    </div>
  );
};

export default AskAmmaPage;
