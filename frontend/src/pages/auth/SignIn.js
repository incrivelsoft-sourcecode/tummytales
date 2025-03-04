import React, { useState } from "react";
import { FaGoogle, FaApple } from "react-icons/fa"; // Icons for social login
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import "../../styles/SignIn.css"; // Import the separate CSS file

const SignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/users/login`,
        {
          emailOrUsername: username,
          password: password
        }
      );
      if (res.status === 200) {
        console.log(res.data);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userName", res.data.userName);
        localStorage.setItem("role", res.data.role);
        toast.success(res.data.message || "Login successful...", { "position": "top-center" });
        setTimeout(() => {
          navigate("/");
        }, 3000);

      }

    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message || "Internal server error", { "position": "top-center" });
    }
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
              className=""
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
        <input
          id="password"
          name="password"
          type={isPasswordVisible ? "text" : "password"}
          className="password-input"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
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
          <button
            className="social-button google"
            onClick={() => {
              window.location.href = `${process.env.REACT_APP_BACKEND_URL}/users/google`;
            }}>
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
