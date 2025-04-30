import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const profileImage = "/image.png"; // Actual profile image
  const dummyImage = "/dummy-profile.png"; // Dummy image when not logged in
  const [showPregnancyDropdown, setShowPregnancyDropdown] = useState(false);
  const [formData, setFormData] = useState({});

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
    const userId = localStorage.getItem("userId");
    const existingSurveyId = localStorage.getItem("surveyId");
  
    if (!userId) return;
  
    // If no surveyId is saved, fetch all surveys to get one
    if (!existingSurveyId) {
      axios
        .get(`${process.env.REACT_APP_BACKEND_URL}/mom/all/surveys?userId=${userId}`)
        .then((res) => {
          if (res.data && res.data.surveys && res.data.surveys.length > 0) {
            const latestSurvey = res.data.surveys[0]; // or use .at(-1) for latest
            localStorage.setItem("surveyId", latestSurvey._id);
  
            // Now fetch that survey by ID
            axios
              .get(`${process.env.REACT_APP_BACKEND_URL}/mom/survey/${latestSurvey._id}?userId=${userId}`)
              .then((res) => {
                if (res.data && res.data.survey) {
                  setFormData(res.data.survey);
                }
              })
              .catch((err) => {
                console.error("Error fetching survey by ID:", err);
              });
          }
        })
        .catch((err) => {
          console.error("Error fetching all surveys:", err);
        });
    } else {
      // surveyId exists, fetch it directly
      axios
        .get(`${process.env.REACT_APP_BACKEND_URL}/mom/survey/${existingSurveyId}?userId=${userId}`)
        .then((res) => {
          if (res.data && res.data.survey) {
            setFormData(res.data.survey);
          }
        })
        .catch((err) => {
          console.error("Error fetching survey by ID:", err);
        });
    }
  }, [isLoggedIn]);
  
  
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


  // Check if the current route is related to Pregnancy Map or its subpages
  const isPregnancyMapActive =
    location.pathname === "/pregnancy-map" ||
    location.pathname === "/essential-tests" ||
    location.pathname === "/thali" ||
    location.pathname === "/set-up-baby";

  return (
    <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-16 py-4 bg-[#2A2A0A] text-[#D4D700] shadow-md z-50">
      {/* Logo */}
      <div className="flex justify-center items-center border-2 border-blue-500 bg-[#F8E8FF] p-2">
        <span className="text-[2rem] font-extrabold tracking-wide relative leading-none">
          <span className="inline-block outline-text -rotate-12">T</span>
          <span className="inline-block outline-text">u</span>
          <span className="inline-block outline-text rotate-6">m</span>
          <span className="inline-block outline-text -rotate-6">m</span>
          <span className="inline-block outline-text rotate-3">y</span>
          <span className="inline-block outline-text rotate-12">T</span>
          <span className="inline-block outline-text">a</span>
          <span className="inline-block outline-text">l</span>
          <span className="inline-block outline-text -rotate-3">e</span>
          <span className="inline-block outline-text rotate-6">s</span>
        </span>
      </div>

      {/* Navigation Links */}
      <ul className="flex gap-10 text-lg font-medium">
        <li>
          <a
            href="/"
            className={`px-3 py-1 ${
              location.pathname === "/" ? "underline" : ""
            }`}
          >
            Home
          </a>
        </li>

        {/* Pregnancy Map Dropdown */}
        <li
          className="relative group"
          onMouseEnter={() => setShowPregnancyDropdown(true)}
          onMouseLeave={() => setShowPregnancyDropdown(false)}
        >
          <a className={`px-3 py-1 ${isPregnancyMapActive ? "underline" : ""}`}>
            Pregnancy Map
          </a>
          {showPregnancyDropdown && (
            <ul className="absolute left-0 mt-1 w-48 bg-[#2d2d08] text-[#d4d75f] shadow-lg rounded-md">
              <li>
                <a
                  href="/essential-tests"
                  className={`block px-3 py-2 hover:bg-[#3b3b10] ${
                    location.pathname === "/essential-tests" ? "underline" : ""
                  }`}
                >
                  Your Essential Tests
                </a>
              </li>
              <li>
                <a
                  href="/thali"
                  className={`block px-3 py-2 hover:bg-[#3b3b10] ${
                    location.pathname === "/thali" ? "underline" : ""
                  }`}
                >
                  What's In Your Thali
                </a>
              </li>
              <li>
                <a
                  href="/set-up-baby"
                  className={`block px-3 py-2 hover:bg-[#3b3b10] ${
                    location.pathname === "/set-up-baby" ? "underline" : ""
                  }`}
                >
                  Set Up For The Baby
                </a>
              </li>
            </ul>
          )}
        </li>

        <li>
          <a
            href="/mom-network"
            className={`px-3 py-1 ${
              location.pathname === "/mom-network" ? "underline" : ""
            }`}
          >
            Mom-to-Mom Network
          </a>
        </li>
        <li>
          <a
            href="/ask-amma"
            className={`px-3 py-1 ${
              location.pathname === "/ask-amma" ? "underline" : ""
            }`}
          >
            Ask Amma
          </a>
        </li>
        <li>
          <a
            href="/resources"
            className={`px-3 py-1 ${
              location.pathname === "/resources" ? "underline" : ""
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
              {/* Profile Link Updated with userId */}
              <li
  className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
  onClick={async () => {
    const surveyId = localStorage.getItem("surveyId");
    const userId = localStorage.getItem("userId");

    if (surveyId) {
      navigate(`/profile-display/${surveyId}`);
    } else if (userId) {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/mom/all/surveys?userId=${userId}`
        );
        const surveys = res.data?.surveys;
        if (surveys && surveys.length > 0) {
          const latestSurveyId = surveys[0]._id;
          localStorage.setItem("surveyId", latestSurveyId);
          navigate(`/profile-display/${latestSurveyId}`);
        } else {
          alert("No profile found.");
        }
      } catch (err) {
        console.error("Error fetching surveys:", err);
        alert("Failed to fetch profile.");
      }
    } else {
      alert("No profile found.");
    }
    setShowDropdown(false);
  }}
>
  Profile
</li>

              {isLoggedIn ? (
                <li
                  className="px-4 py-2 hover:bg-red-500 text-black cursor-pointer"
                  onClick={() => {
                    localStorage.clear();
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
