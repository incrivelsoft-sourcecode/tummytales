import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPopup = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-xl shadow-lg p-5 w-80">
        <p className="text-gray-700 text-sm text-center">
          Create an account with us!
        </p>

        <div className="flex justify-center mt-3">
          <button
            className="bg-purple-600 text-white px-5 py-2 rounded-md text-sm"
            onClick={() => {
              navigate("/register"); // Navigate to Register page
              onClose(); // Close the popup
            }}
          >
            Sign up
          </button>
        </div>

        <p className="text-gray-600 text-xs text-center mt-2">
          Already have an account?{" "}
          <span
            className="text-purple-700 font-semibold cursor-pointer"
            onClick={() => {
              navigate("/signin"); // Navigate to Sign-in page
              onClose(); // Close the popup
            }}
          >
            Sign in
          </span>
        </p>

        {/* Close Button */}
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          ✖
        </button>
      </div>
    </div>
  );
};



export default LoginPopup;
