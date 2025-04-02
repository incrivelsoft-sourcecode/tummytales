import React, { useState } from "react";

const App = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [reminderTimes, setReminderTimes] = useState({});

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const handleCheckboxChange = (category, option) => {
    setSelectedOptions((prev) => {
      const categorySelections = prev[category] || [];
      if (categorySelections.includes(option)) {
        return {
          ...prev,
          [category]: categorySelections.filter((item) => item !== option),
        };
      } else {
        return {
          ...prev,
          [category]: [...categorySelections, option],
        };
      }
    });
  };

  const handleTimeChange = (event, meal) => {
    setReminderTimes((prev) => ({
      ...prev,
      [meal]: event.target.value,
    }));
  };

  const dropdowns = [
    {
      title: "Cuisine You Prefer",
      options: ["North Indian", "South Indian", "Indo-Chinese", "Mexican", "Thai", "American-Southern", "No Preference"],
    },
    {
      title: "Dietary Preferences",
      options: ["Vegetarian", "Vegan", "Gluten-Free", "High-Protein", "High-Fiber", "Low-Sodium", "No Preference"],
    },
    {
      title: "Allergies",
      options: ["Peanuts", "Tree Nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Corn", "Fruits", "Legumes", "Add Allergy", "No Preference"],
    },
    {
      title: "Reminders",
      options: ["Breakfast", "Lunch", "Snack", "Dinner","Dessert"],
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="bg-[#b6b97b] flex flex-col justify-center items-center p-10 w-full">
        <h1 className="text-4xl font-bold text-black drop-shadow-lg mb-6">
          Kitchen to Table – Daily Food Recommendations
        </h1>
        <div className="flex justify-center space-x-10">
          {dropdowns.map((dropdown, index) => (
            <div key={index} className="relative inline-block text-lg text-yellow-100">
              <div
                className="border-b border-yellow-300 cursor-pointer p-2"
                onClick={() => toggleDropdown(index)}
              >
                {dropdown.title}
              </div>
              {openDropdown === index && (
                <div className="absolute left-0 mt-2 w-56 bg-white text-black shadow-lg rounded-md p-2">
                  {dropdown.options.map((option, idx) => (
                    <div key={idx} className="p-2 border-b last:border-b-0">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedOptions[dropdown.title]?.includes(option) || false}
                          onChange={() => handleCheckboxChange(dropdown.title, option)}
                        />
                        {option}
                      </label>
                      {dropdown.title === "Reminders" && selectedOptions[dropdown.title]?.includes(option) && (
                        <input
                          type="time"
                          value={reminderTimes[option] || ""}
                          onChange={(e) => handleTimeChange(e, option)}
                          className="mt-2 w-full p-1 border rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div 
        className="flex-grow bg-cover bg-center flex flex-col justify-center items-center text-white w-full"
        style={{ 
          backgroundImage: "url('/dailymealimage.jpg')", 
          backgroundSize: "cover", 
          backgroundPosition: "center" 
        }}
      >
        <h2 className="text-5xl font-bold drop-shadow-lg mb-4">Breakfast</h2>
        <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Lunch</h2>
        <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Dinner</h2>
        <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Drinks</h2>
        <h2 className="text-4xl font-bold drop-shadow-lg mb-4">Dessert</h2>
      </div>
    </div>
  );
};

export default App;