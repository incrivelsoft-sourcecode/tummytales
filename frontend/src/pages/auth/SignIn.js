import React, { useState } from "react";
import { FaGoogle, FaApple } from "react-icons/fa"; // Icons for social login
import { useNavigate } from "react-router-dom";
import "../../styles/SignIn.css"; // Import the separate CSS file

const SignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Signing in with:", username, password);
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <h2 className="signin-title">Sign In</h2>
        <form onSubmit={handleSubmit} className="signin-form">
          {/* Username Field */}
          <div>
            <label className="signin-label">Username</label>
            <input
              type="text"
              className="signin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="signin-label">Password</label>
            <div className="signin-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="signin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="signin-eye-icon"
              >
                👁️
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button type="submit" className="signin-button">
            Sign in
          </button>
        </form>

        {/* OR Divider */}
        <div className="signin-divider">
          <div className="signin-line"></div>
          <span className="signin-or-text">Or Sign in with</span>
          <div className="signin-line"></div>
        </div>

        {/* Social Sign-In Buttons */}
        <div className="signin-social-buttons">
          <button className="social-button google">
            <FaGoogle />
          </button>
          <button className="social-button apple">
            <FaApple />
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="signin-signup-text">
          Create an account with us!{" "}
          <button onClick={() => navigate("/signup")} className="signup-button">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
