import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc"; // Google icon
import "../../styles/SelectRole.css"; // Import the CSS file

const SelectRole = () => {
  const navigate = useNavigate();
  const [showMotherUsernameInput, setShowMotherUsernameInput] = useState(false);
  const [showSupporterUsernameInput, setShowSupporterUsernameInput] = useState(false);
  const [motherUsername, setMotherUsername] = useState("");
  const [supporterUsername, setSupporterUsername] = useState("");

  const handleMotherGoogleAuth = () => {
    if (showMotherUsernameInput && motherUsername.trim()) {
      // Username is provided, redirect to OAuth with the username
      window.location.href = `${process.env.REACT_APP_BACKEND_URL}/users/google?role=mom&user_name=${motherUsername}`;
    
    } else {
      // Show username input
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
    <div className="role-container">
      <h2 className="role-title">Select Your Role</h2>
      <div className="role-cards">
        {/* Mother Card */}
        <div className="role-card mother-card">
          <div className="role-card-content">
            <h3>Mother</h3>
            <p>Sign up as a mother</p>
            <button className="manual-btn" onClick={() => navigate("/signup")}>
              Manual Registration
            </button>
            
            {!showMotherUsernameInput ? (
              <div
                className="google-login"
                onClick={handleMotherGoogleAuth}
              >
                <FcGoogle className="google-icon" />
                <span>Sign up with Google</span>
              </div>
            ) : (
              <div className="username-container">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={motherUsername}
                  onChange={(e) => setMotherUsername(e.target.value)}
                  className="username-input"
                />
                <button 
                  className="register-btn"
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
        <div className="role-card supporter-card">
          <div className="role-card-content">
            <h3>Supporter</h3>
            <p>Support mothers in their journey</p>
            <button className="manual-btn" onClick={() => navigate("/SupporterRegister")}>
              Manual Registration
            </button>
            
            {!showSupporterUsernameInput ? (
              <div
                className="google-login"
                onClick={handleSupporterGoogleAuth}
              >
                <FcGoogle className="google-icon" />
                <span>Sign up with Google</span>
              </div>
            ) : (
              <div className="username-container">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={supporterUsername}
                  onChange={(e) => setSupporterUsername(e.target.value)}
                  className="username-input"
                />
                <button 
                  className="register-btn"
                  onClick={handleSupporterGoogleAuth}
                  disabled={!supporterUsername.trim()}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;