import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MomNetworkPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row items-center min-h-screen bg-[#FEFDE5] p-6 md:p-12">
      {/* Left Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
          Mom-to-Mom Network
        </h1>
        <p className="text-gray-700 text-base md:text-lg mb-6 max-w-lg mx-auto md:mx-0">
          Hey Mom! Have questions, concerns, or just something on your mind that only other moms would understand? 
          We’re here for you! Join our thread and chat function with a community of moms who truly get it. Don’t be 
          afraid, ask away. You’re never alone—let’s navigate this journey together!
        </p>
        <div className="flex justify-center md:justify-start">
          <button onClick={() => {
            navigate("/mom-supporter-network")
          }} className="px-4 py-2 border border-gray-800 rounded-md text-gray-800 font-medium text-sm hover:bg-gray-200 transition">
            Join the Network!
          </button>
        </div>
      </div>
      
      {/* Right Section (Image) */}
      <div className="w-full md:w-1/2 h-64 md:h-screen mt-6 md:mt-0">
        <img
          src="momnetworkimage.jpg"
          alt="Scenic View"
          className="w-full h-full object-cover rounded-lg shadow-md"
        />
      </div>
    </div>
  );
};

export default MomNetworkPage;