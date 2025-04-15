import React, { useState } from "react";

const App = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [reminderDetails, setReminderDetails] = useState({});
  const [activeReminder, setActiveReminder] = useState(null);

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const handleCheckboxChange = (category, option) => {
    setSelectedOptions((prev) => {
      const categorySelections = prev[category] || [];
      const isSelected = categorySelections.includes(option);
      const newSelections = isSelected
        ? categorySelections.filter((item) => item !== option)
        : [...categorySelections, option];

      // Set or clear active reminder
      if (category === "Reminders") {
        if (!isSelected) setActiveReminder(option);
        else if (activeReminder === option) setActiveReminder(null);
      }

      return {
        ...prev,
        [category]: newSelections,
      };
    });
  };

  const handleDetailChange = (meal, field, value) => {
    setReminderDetails((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value,
      },
    }));
  };

  const dropdowns = [
    {
      title: "Cuisine You Prefer",
      options: [
        "North Indian",
        "South Indian",
        "Indo-Chinese",
        "Mexican",
        "Thai",
        "American-Southern",
        "No Preference",
      ],
    },
    {
      title: "Dietary Preferences",
      options: [
        "Vegetarian",
        "Vegan",
        "Gluten-Free",
        "High-Protein",
        "High-Fiber",
        "Low-Sodium",
        "No Preference",
      ],
    },
    {
      title: "Allergies",
      options: [
        "Peanuts",
        "Tree Nuts",
        "Milk",
        "Eggs",
        "Wheat",
        "Soy",
        "Fish",
        "Corn",
        "Fruits",
        "Legumes",
        "Add Allergy",
        "No Preference",
      ],
    },
    {
      title: "Reminders",
      options: ["Breakfast", "Lunch", "Snack", "Dinner", "Dessert"],
    },
  ];

  const handleSectionClick = (section) => {
    console.log("Navigate to:", section);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="bg-[#b6b97b] flex flex-col justify-center items-center p-10 w-full">
        <h1 className="text-4xl font-bold text-black drop-shadow-lg mb-6">
          Kitchen to Table – Daily Food Recommendations
        </h1>
        <div className="flex justify-center space-x-10">
          {dropdowns.map((dropdown, index) => (
            <div
              key={index}
              className="relative inline-block text-lg text-yellow-100"
            >
              <div
                className="border-b border-yellow-300 cursor-pointer p-2"
                onClick={() => toggleDropdown(index)}
              >
                {dropdown.title}
              </div>
              {openDropdown === index && (
                <div className="absolute left-0 mt-2 w-64 bg-white text-black shadow-lg rounded-md p-2 z-10 max-h-64 overflow-y-auto">
                  {dropdown.options.map((option, idx) => (
                    <div key={idx} className="p-2 border-b last:border-b-0">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={
                            selectedOptions[dropdown.title]?.includes(option) ||
                            false
                          }
                          onChange={() =>
                            handleCheckboxChange(dropdown.title, option)
                          }
                        />
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right-side sliding panel for Reminders */}
      {activeReminder && (
        <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl p-4 transition-transform duration-300 z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {activeReminder} Reminder
            </h2>
            <button
              className="text-red-500 font-bold text-lg"
              onClick={() => {
                handleCheckboxChange("Reminders", activeReminder);
              }}
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="time"
              value={reminderDetails[activeReminder]?.time || ""}
              onChange={(e) =>
                handleDetailChange(activeReminder, "time", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
            <input
              type="date"
              value={reminderDetails[activeReminder]?.date || ""}
              onChange={(e) =>
                handleDetailChange(activeReminder, "date", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
            <select
              value={reminderDetails[activeReminder]?.timezone || ""}
              onChange={(e) =>
                handleDetailChange(activeReminder, "timezone", e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Select Timezone</option>
              <option value="America/Los_Angeles">
                Pacific Time (PST)
              </option>
              <option value="America/Denver">Mountain Time (MST)</option>
              <option value="America/Chicago">Central Time (CST)</option>
              <option value="America/New_York">Eastern Time (EST)</option>
              <option value="America/Phoenix">Arizona (no DST)</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="UTC">UTC</option>
            </select>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reminderDetails[activeReminder]?.repeatDaily || false}
                onChange={(e) =>
                  handleDetailChange(
                    activeReminder,
                    "repeatDaily",
                    e.target.checked
                  )
                }
              />
              <span>Repeat Daily</span>
            </label>
          </div>
        </div>
      )}

      <div
        className="flex-grow bg-cover bg-center flex flex-col justify-center items-center text-white w-full"
        style={{
          backgroundImage: "url('/dailymealimage.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {["Breakfast", "Lunch", "Dinner", "Drinks", "Dessert"].map(
          (meal, index) => (
            <h2
              key={index}
              className="text-4xl md:text-5xl font-bold drop-shadow-lg mb-4 cursor-pointer hover:underline"
              onClick={() => handleSectionClick(meal)}
            >
              {meal}
            </h2>
          )
        )}
      </div>
    </div>
  );
};

export default App;






// import React, { useState } from "react";

// const App = () => {
//   const [openDropdown, setOpenDropdown] = useState(null);
//   const [selectedOptions, setSelectedOptions] = useState({});
//   const [reminderTimes, setReminderTimes] = useState({});

//   const toggleDropdown = (key) => {
//     setOpenDropdown((prev) => (prev === key ? null : key));
//   };

//   const handleCheckboxChange = (category, option) => {
//     setSelectedOptions((prev) => {
//       const categorySelections = prev[category] || [];
//       if (categorySelections.includes(option)) {
//         return {
//           ...prev,
//           [category]: categorySelections.filter((item) => item !== option),
//         };
//       } else {
//         return {
//           ...prev,
//           [category]: [...categorySelections, option],
//         };
//       }
//     });
//   };

//   const handleTimeChange = (event, meal) => {
//     setReminderTimes((prev) => ({
//       ...prev,
//       [meal]: event.target.value,
//     }));
//   };

//   const dropdowns = [
//     {
//       title: "Cuisine You Prefer",
//       options: ["North Indian", "South Indian", "Indo-Chinese", "Mexican", "Thai", "American-Southern", "No Preference"],
//     },
//     {
//       title: "Dietary Preferences",
//       options: ["Vegetarian", "Vegan", "Gluten-Free", "High-Protein", "High-Fiber", "Low-Sodium", "No Preference"],
//     },
//     {
//       title: "Allergies",
//       options: ["Peanuts", "Tree Nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Corn", "Fruits", "Legumes", "Add Allergy", "No Preference"],
//     },
//     {
//       title: "Reminders",
//       options: ["Breakfast", "Lunch", "Snack", "Dinner","Dessert"],
//     },
//   ];

//   return (
//     <div className="min-h-screen w-full flex flex-col">
//       <div className="bg-[#b6b97b] flex flex-col justify-center items-center p-10 w-full">
//         <h1 className="text-4xl font-bold text-black drop-shadow-lg mb-6">
//           Kitchen to Table – Daily Food Recommendations
//         </h1>
//         <div className="flex justify-center space-x-10">
//           {dropdowns.map((dropdown, index) => (
//             <div key={index} className="relative inline-block text-lg text-yellow-100">
//               <div
//                 className="border-b border-yellow-300 cursor-pointer p-2"
//                 onClick={() => toggleDropdown(index)}
//               >
//                 {dropdown.title}
//               </div>
//               {openDropdown === index && (
//                 <div className="absolute left-0 mt-2 w-56 bg-white text-black shadow-lg rounded-md p-2">
//                   {dropdown.options.map((option, idx) => (
//                     <div key={idx} className="p-2 border-b last:border-b-0">
//                       <label className="flex items-center cursor-pointer">
//                         <input
//                           type="checkbox"
//                           className="mr-2"
//                           checked={selectedOptions[dropdown.title]?.includes(option) || false}
//                           onChange={() => handleCheckboxChange(dropdown.title, option)}
//                         />
//                         {option}
//                       </label>
//                       {dropdown.title === "Reminders" && selectedOptions[dropdown.title]?.includes(option) && (
//                         <input
//                           type="time"
//                           value={reminderTimes[option] || ""}
//                           onChange={(e) => handleTimeChange(e, option)}
//                           className="mt-2 w-full p-1 border rounded"
//                         />
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//       <div 
//         className="flex-grow bg-cover bg-center flex flex-col justify-center items-center text-white w-full"
//         style={{ 
//           backgroundImage: "url('/dailymealimage.jpg')", 
//           backgroundSize: "cover", 
//           backgroundPosition: "center" 
//         }}
//       >
//         <h2 className="text-5xl font-bold drop-shadow-lg mb-4">Breakfast</h2>
//         <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Lunch</h2>
//         <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Dinner</h2>
//         <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Drinks</h2>
//         <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Dessert</h2>
//       </div>
//     </div>
//   );
// };

// export default App;