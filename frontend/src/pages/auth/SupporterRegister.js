import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: ""
  });
  const [error, setError] = useState("");
  
  // Query params state
  const [queryParams, setQueryParams] = useState({
    referal_code: "",
    permissions: [],
    role: "supporter"
  });

  // Extract query parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referalCode = params.get("referal_code") || "";
    const permissionsString = params.get("permissions") || "";
    const role = params.get("role") || "supporter";
    
    // Parse permissions from comma-separated string to array
    const permissions = permissionsString ? permissionsString.split(",") : [];
    
    setQueryParams({
      referal_code: referalCode,
      permissions: permissions,
      role: role
    });
    console.log(referalCode, permissions, role);
  }, [location]);

  const handleGoogleAuth = () => {
    if (showUsernameInput && username.trim()) {
      // Include all query params in the OAuth URL
      const permissionsParam = queryParams.permissions.join(",");
      window.location.href = `${process.env.REACT_APP_BACKEND_URL}/users/google?role=${queryParams.role}&referal_code=${queryParams.referal_code}&permissions=${permissionsParam}&user_name=${username}`;
    } else {
      setShowUsernameInput(true);
    }
  };

  const handleManualRegistration = () => {
    setShowRegistrationModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData({
      ...registrationData,
      [name]: value
    });
  };

  const validateForm = () => {
    if (!registrationData.email || !registrationData.password || !registrationData.confirmPassword || !registrationData.username) {
      setError("All fields are required");
      return false;
    }
    
    if (!registrationData.email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    if (registrationData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    
    if (registrationData.password !== registrationData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    try {
      if (!validateForm()) return;
      
      setError("");
      
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/users/register-user`, {
        email: registrationData.email,
        password: registrationData.password,
        confirm_password: registrationData.confirmPassword,
        user_name: registrationData.username,
        role: queryParams.role,
        referal_code: queryParams.referal_code,
        permissions: queryParams.permissions
      });
      
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
          localStorage.setItem("userName", response.data.userName);
          localStorage.setItem("role", response.data.role);
          localStorage.setItem("userId", response.data.userId);
        navigate("/dashboard");
      } else {
        setError("Registration successful. Please login.");
        setShowRegistrationModal(false);
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-6 bg-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-10">Become a Supporter</h2>
      
      <div className="flex flex-col justify-center items-center w-full max-w-md">
        {/* Supporter Card */}
        <div className="relative flex flex-col items-center w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            className="w-full h-40 bg-cover bg-center"
            style={{ backgroundImage: "url('https://www.shutterstock.com/shutterstock/photos/404955949/display_1500/stock-vector-nurse-at-work-vector-illustration-of-cheerful-nurse-404955949.jpg')" }}
          ></div>

          <div className="p-6 text-center w-full">
            <h3 className="text-xl font-semibold text-gray-900">Supporter</h3>
            <p className="text-gray-600 mb-4">Support mothers in their journey</p>
            
            <button 
              className="w-full bg-blue-500 text-white font-semibold py-2 rounded-full hover:bg-blue-600 transition"
              onClick={handleManualRegistration}
            >
              Manual Registration
            </button>

            {!showUsernameInput ? (
              <div 
                className="flex items-center justify-center w-full border border-gray-300 rounded-lg p-2 mt-4 cursor-pointer hover:bg-gray-100"
                onClick={handleGoogleAuth}
              >
                <FcGoogle className="text-2xl" />
                <span className="ml-2 text-gray-700">Sign up with Google</span>
              </div>
            ) : (
              <div className="mt-4 w-full">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
                />
                <button 
                  className="w-full bg-green-500 text-white font-semibold py-2 rounded-full mt-2 hover:bg-green-600 transition"
                  onClick={handleGoogleAuth}
                  disabled={!username.trim()}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Account</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                name="email"
                className="w-full p-2 border border-gray-300 rounded"
                value={registrationData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                name="username"
                className="w-full p-2 border border-gray-300 rounded"
                value={registrationData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                name="password"
                className="w-full p-2 border border-gray-300 rounded"
                value={registrationData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                className="w-full p-2 border border-gray-300 rounded"
                value={registrationData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowRegistrationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleRegister}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectRole;