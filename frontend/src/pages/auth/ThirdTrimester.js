import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ThirdTrimester = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("Your Body");
  const [startIndex, setStartIndex] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(28);

  const weeks = Array.from({ length: 14 }, (_, i) => i + 28);
  const visibleWeeks = weeks.slice(startIndex, startIndex + 6);

  const handleNext = () => {
    if (startIndex + 6 < weeks.length) {
      setStartIndex(startIndex + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1);
    }
  };

  const tabs = [
    "Your Body",
    "Baby’s Developments",
    "Pregnancy Symptoms",
    "Video Highlights",
    "South Asian Tips and Myths",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-100 to-red-300 p-6">
      <div className="relative max-w-4xl w-full mx-auto p-4 bg-white shadow-lg rounded-lg h-auto overflow-auto">
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 text-gray-500 text-lg font-bold hover:text-gray-700 transition-all"
        >
          ✖
        </button>

        <h2 className="text-center text-2xl font-bold text-red-700">
          Third Trimester
        </h2>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            className="text-red-700 text-xl disabled:opacity-50"
            disabled={startIndex === 0}
          >
            ◀
          </button>

          {visibleWeeks.map((week) => (
            <motion.div
              key={week}
              className={`flex items-center justify-center w-16 h-16 rounded-full text-lg font-semibold cursor-pointer text-center shadow-md transition-all ${
                selectedWeek === week
                  ? "bg-red-600 text-white scale-150 shadow-lg"
                  : "bg-gray-300 text-gray-700 hover:bg-red-400 hover:text-white"
              }`}
              whileTap={{ scale: 1.3 }}
              animate={{ scale: selectedWeek === week ? 1.5 : 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedWeek(week)}
            >
              Week {week}
            </motion.div>
          ))}

          <button
            onClick={handleNext}
            className="text-red-700 text-xl disabled:opacity-50"
            disabled={startIndex + 6 >= weeks.length}
          >
            ▶
          </button>
        </div>

        <h3 className="text-center mt-8 text-2xl font-semibold text-red-700">
          Welcome to Week {selectedWeek}!
        </h3>
        <p className="text-center text-gray-600 mt-2">
          You are now in <b>Week {selectedWeek}</b> of your pregnancy. Your baby is preparing for birth!
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 rounded-lg text-lg font-medium shadow-md transition-all ${
                selectedTab === tab
                  ? "bg-red-500 text-white scale-110"
                  : "bg-gray-200 text-gray-700 hover:bg-red-300 hover:text-white"
              }`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gray-100 rounded-lg shadow-inner">
          {selectedTab === "Your Body" && (
            <div>
              <h4 className="text-xl font-semibold text-red-700">
                How Your Body Feels in Week {selectedWeek}:
              </h4>
              <p className="text-gray-600 mt-2">
                You might experience swelling, back pain, and shortness of breath...
              </p>
            </div>
          )}

          {selectedTab === "Baby’s Developments" && (
            <div>
              <h4 className="text-xl font-semibold text-red-700">
                Baby’s Developments:
              </h4>
              <p className="text-gray-600 mt-2">
                Your baby is gaining weight, and lungs are maturing...
              </p>
            </div>
          )}

          {selectedTab === "Pregnancy Symptoms" && (
            <div>
              <h4 className="text-xl font-semibold text-red-700">
                Pregnancy Symptoms and Tips:
              </h4>
              <p className="text-gray-600 mt-2">
                You may experience frequent urination, fatigue, and contractions...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThirdTrimester;