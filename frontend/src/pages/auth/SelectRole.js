import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const SelectRole = () => {
  const navigate = useNavigate();
  const [showMotherUsernameInput, setShowMotherUsernameInput] = useState(false);
  const [showSupporterUsernameInput, setShowSupporterUsernameInput] = useState(false);
  const [motherUsername, setMotherUsername] = useState("");
  const [supporterUsername, setSupporterUsername] = useState("");

  const handleMotherGoogleAuth = () => {
    if (showMotherUsernameInput && motherUsername.trim()) {
      window.location.href = `${process.env.REACT_APP_BACKEND_URL}/users/google?role=mom&user_name=${motherUsername}`;
    } else {
      setShowMotherUsernameInput(true);
    }
  };

  const handleSupporterGoogleAuth = () => {
    if (showSupporterUsernameInput && supporterUsername.trim()) {
      window.location.href = `${process.env.REACT_APP_BACKEND_URL}/users/google?role=supporter&referral_code=67c044e3b9b8c82ca2345506&user_name=${supporterUsername}`;
    } else {
      setShowSupporterUsernameInput(true);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-6 bg-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-10">Select Your Role</h2>
      
      <div className="flex flex-col justify-center md:flex-row gap-28 w-full max-w-4xl">
        
        {/* Mother Card */}
        <div className="relative flex flex-col items-center w-full max-w-xs bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            className="w-full h-40 bg-cover bg-center"
            style={{ backgroundImage: "url('https://www.shutterstock.com/shutterstock/photos/2070238631/display_1500/stock-vector-pregnant-woman-future-mom-standing-in-nature-and-hugging-belly-with-arms-flat-vector-2070238631.jpg')" }}
          ></div>

          <div className="p-6 text-center">
            <h3 className="text-xl font-semibold text-gray-900">Mother</h3>
            <p className="text-gray-600 mb-4">Sign up as a mother</p>
            
            <button 
              className="w-full bg-blue-500 text-white font-semibold py-2 rounded-full hover:bg-blue-600 transition"
              onClick={() => navigate("/signup")}
            >
              Manual Registration
            </button>

            {!showMotherUsernameInput ? (
              <div 
                className="flex items-center justify-center w-full border border-gray-300 rounded-lg p-2 mt-4 cursor-pointer hover:bg-gray-100"
                onClick={handleMotherGoogleAuth}
              >
                <FcGoogle className="text-2xl" />
                <span className="ml-2 text-gray-700">Sign up with Google</span>
              </div>
            ) : (
              <div className="mt-4 w-full">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={motherUsername}
                  onChange={(e) => setMotherUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
                />
                <button 
                  className="w-full bg-green-500 text-white font-semibold py-2 rounded-full mt-2 hover:bg-green-600 transition"
                  onClick={handleMotherGoogleAuth}
                  disabled={!motherUsername.trim()}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Supporter Card */}
        {/* <div className="relative flex flex-col items-center w-full max-w-xs bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            className="w-full h-40 bg-cover bg-center"
            style={{ backgroundImage: "url('https://www.shutterstock.com/shutterstock/photos/404955949/display_1500/stock-vector-nurse-at-work-vector-illustration-of-cheerful-nurse-404955949.jpg')" }}
          ></div>

          <div className="p-6 text-center">
            <h3 className="text-xl font-semibold text-gray-900">Supporter</h3>
            <p className="text-gray-600 mb-4">Support mothers in their journey</p>
            
            <button 
              className="w-full bg-blue-500 text-white font-semibold py-2 rounded-full hover:bg-blue-600 transition"
              onClick={() => navigate("/SupporterRegister")}
            >
              Manual Registration
            </button>

            {!showSupporterUsernameInput ? (
              <div 
                className="flex items-center justify-center w-full border border-gray-300 rounded-lg p-2 mt-4 cursor-pointer hover:bg-gray-100"
                onClick={handleSupporterGoogleAuth}
              >
                <FcGoogle className="text-2xl" />
                <span className="ml-2 text-gray-700">Sign up with Google</span>
              </div>
            ) : (
              <div className="mt-4 w-full">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={supporterUsername}
                  onChange={(e) => setSupporterUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
                />
                <button 
                  className="w-full bg-green-500 text-white font-semibold py-2 rounded-full mt-2 hover:bg-green-600 transition"
                  onClick={handleSupporterGoogleAuth}
                  disabled={!supporterUsername.trim()}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div> */}

      </div>
    </div>
  );
};

export default SelectRole;
