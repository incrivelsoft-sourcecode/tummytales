import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const PregnancyTracker = () => {
  const navigate = useNavigate(); // Initialize navigate function
  const [selectedWeek, setSelectedWeek] = useState(12);
  const [startIndex, setStartIndex] = useState(0);
  const [medications, setMedications] = useState(["Folic Acid"]);
  const [checklist, setChecklist] = useState([
    "Schedule a prenatal check-up",
    "Eat more iron-rich foods",
    "Start light exercises",
  ]);

  const weeks = Array.from({ length: 40 }, (_, i) => i + 1);
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

  const addMedication = () => {
    setMedications([...medications, `New Medication ${medications.length + 1}`]);
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, "New Task"]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-100 to-purple-300 p-6">
      {/* Go Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-black-600"
      >
        ⬅ Go Back
      </button>

      {/* Header */}
      <h2 className="text-2xl font-bold text-purple-700">Pregnancy Tracker</h2>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={handlePrev} className="text-purple-700 text-xl disabled:opacity-50" disabled={startIndex === 0}>
          ◀
        </button>

        {visibleWeeks.map((week) => (
          <div
            key={week}
            className={`flex items-center justify-center w-16 h-16 rounded-full text-lg font-semibold cursor-pointer shadow-md transition-all ${
              selectedWeek === week
                ? "bg-purple-600 text-white scale-110 shadow-lg"
                : "bg-gray-300 text-gray-700 hover:bg-purple-400 hover:text-white"
            }`}
            onClick={() => setSelectedWeek(week)}
          >
            {week}
          </div>
        ))}

        <button onClick={handleNext} className="text-purple-700 text-xl disabled:opacity-50" disabled={startIndex + 6 >= weeks.length}>
          ▶
        </button>
      </div>

      {/* Welcome Message */}
      <h3 className="text-center mt-8 text-2xl font-semibold text-purple-700">Welcome to Week {selectedWeek}!</h3>

      {/* Medication Reminder Section */}
      <div className="mt-8 p-6 bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <h4 className="text-xl font-semibold text-purple-700">Week {selectedWeek} Medication Reminders</h4>
        <div className="mt-4">
          {medications.map((med, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg shadow-sm mt-2">
              <span>{med}</span>
              <span>08:00 AM</span>
            </div>
          ))}
          <button onClick={addMedication} className="mt-3 text-purple-500 underline">
            + Add More
          </button>
        </div>
      </div>

      {/* Checklist Section */}
      <div className="mt-8 p-6 bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <h4 className="text-xl font-semibold text-purple-700">Week {selectedWeek} Checklist</h4>
        <div className="mt-4">
          {checklist.map((task, index) => (
            <div key={index} className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm mt-2">
              <input type="checkbox" className="mr-3" />
              <span>{task}</span>
            </div>
          ))}
          <button onClick={addChecklistItem} className="mt-3 text-purple-500 underline">
            + Add More
          </button>
        </div>
      </div>
    </div>
  );
};

export default PregnancyTracker;
