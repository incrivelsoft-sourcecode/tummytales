import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get the current URL path
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const profileImage = "/image.png"; // Actual profile image
  const dummyImage = "/dummy-profile.png"; // Dummy image when not logged in

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-16 py-4 bg-blue-500 shadow-md z-50">
      <ul className="flex gap-52 text-white font-bold text-lg">
        <li>
          <a
            href="/"
            className={`px-4 py-2 rounded-md ${
              location.pathname === "/" ? "bg-white text-blue-500" : ""
            }`}
          >
            Home
          </a>
        </li>
        <li>
          <a
            href="/pregnancy-map"
            className={`px-4 py-2 rounded-md ${
              location.pathname === "/pregnancy-map" ? "bg-white text-blue-500" : ""
            }`}
          >
            Pregnancy Map
          </a>
        </li>
        <li>
          <a
            href="/mom-supporter-network"
            className={`px-4 py-2 rounded-md ${
              location.pathname === "/mom-supporter-network" ? "bg-white text-blue-500" : ""
            }`}
          >
            Mom Network
          </a>
        </li>
        <li>
          <a
            href="/chatbox"
            className={`px-4 py-2 rounded-md ${
              location.pathname === "/chatbox" ? "bg-white text-blue-500" : ""
            }`}
          >
            Ask AI
          </a>
        </li>
        <li>
          <a
            href="/resources"
            className={`px-4 py-2 rounded-md ${
              location.pathname === "/resources" ? "bg-white text-blue-500" : ""
            }`}
          >
            Resources
          </a>
        </li>
      </ul>

      {/* Profile Icon with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <img
          src={isLoggedIn ? profileImage : dummyImage}
          alt="Profile"
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        />
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg">
            <ul className="text-gray-800 text-center">
              <li
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  navigate("/");
                  setShowDropdown(false);
                }}
              >
                Home
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  navigate("/supporters");
                  setShowDropdown(false);
                }}
              >
                Supporters
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  navigate("/profile");
                  setShowDropdown(false);
                }}
              >
                Profile
              </li>
              {isLoggedIn ? (
                <li
                  className="px-4 py-2 hover:bg-red-500 text-white cursor-pointer"
                  onClick={() => {
                    localStorage.removeItem("token");
                    setIsLoggedIn(false);
                    setShowDropdown(false);
                    navigate("/home");
                  }}
                >
                  Sign Out
                </li>
              ) : (
                <li
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    navigate("/signin");
                    setShowDropdown(false);
                  }}
                >
                  Sign In
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
