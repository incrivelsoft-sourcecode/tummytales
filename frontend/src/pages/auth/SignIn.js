import React, { useState } from "react";
import { FaGoogle, FaApple, FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const SignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/users/login`, {
        emailOrUsername: username,
        password: password,
      });
      if (res.status === 200) {
        console.log(res.data);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userName", res.data.userName);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userId", res.data.userId);
        toast.success(res.data.message || "Login successful...", { position: "top-center" });
        setTimeout(() => {
          navigate("/"); // Redirecting to ProfileSetup page
        }, 3000);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Internal server error", { position: "top-center" });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
      <div className="relative bg-purple-300 p-8 rounded-3xl shadow-lg w-full max-w-md text-center">
        
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition"
          onClick={() => navigate("/")}
        >
          <FaTimes className="text-xl" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-700">Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="text-left">
            <label className="block text-sm text-gray-600">USERNAME</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="text-left relative">
            <label className="block text-sm text-gray-600">PASSWORD</label>
            <div className="relative">
              <input
                type={isPasswordVisible ? "text" : "password"}
                className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 pr-10"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span 
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="w-full bg-black text-white py-2 rounded-full hover:bg-gray-800 font-semibold text-lg">
            LOGIN
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">Or Sign in with</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center gap-2">
          <button
            className="p-2 border border-gray-400 rounded-full bg-white hover:bg-gray-100 w-10 h-10 flex items-center justify-center"
            onClick={() => {
              window.location.href = `${process.env.REACT_APP_BACKEND_URL}/users/google`;
            }}
          >
            <FaGoogle className="text-gray-600 text-lg" />
          </button>
          <button className="p-2 border border-gray-400 rounded-full bg-white hover:bg-gray-100 w-10 h-10 flex items-center justify-center">
            <FaApple className="text-black text-lg" />
          </button>
        </div>

        <p className="mt-4 text-gray-600 text-sm">
          Don't have an account?
          <button onClick={() => navigate("/select-role")} className="ml-1 text-blue-600 hover:underline font-bold">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
