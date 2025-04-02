import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ThaliPage = () => {
  const [openSection, setOpenSection] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Foods to Avoid data
  const foodsToAvoid = [
    {
      title: "Foods That May Induce Contractions",
      items: [
        "Ajwain (Carom Seeds) & Fenugreek (Methi) Seeds: Used post-delivery for lactation but should be limited in early pregnancy as they may stimulate contractions.",
        "Excessive Spicy Foods: Overly spicy dishes can cause acidity, heartburn, and discomfort."
      ]
    },
    {
      title: "Unpasteurized Dairy & Soft Cheeses",
      items: [
        "Unpasteurized milk & soft cheeses (Paneer, Brie, Feta, Blue Cheese): May contain harmful bacteria like listeria, which can lead to infections. Always opt for pasteurized dairy products."
      ]
    },
    {
      title: "Caffeinated & Sugary Drinks",
      items: [
        "Tea & Coffee: High caffeine intake (over 200mg per day) may increase the risk of miscarriage. Limit to one small cup per day.",
        "Soft Drinks & Sugary Juices: Contain artificial sweeteners and high sugar content, which can lead to gestational diabetes."
      ]
    },
    {
      title: "Foods That May Cause Digestive Issues",
      items: [
        "Raw Sprouts: May carry bacteria like E.coli and should be cooked before consumption.",
        "Too much Ghee or Fried Foods: While small amounts of ghee are beneficial, excessive intake can lead to weight gain and indigestion.",
        "Heavy Lentils (Chana Dal, Urad Dal, Rajma): Can cause bloating; should be consumed in moderation.",
        "Raw & Undercooked Seafood, Eggs, and Meat: Do not eat sushi made with raw fish (cooked sushi is safe)."
      ]
    },
    {
      title: "Processed & Preservative-Laden Foods",
      items: [
        "Pickles & Excess Salt: High sodium levels can cause water retention and increased blood pressure.",
        "Packaged & Instant Foods: Often contain preservatives, MSG, and unhealthy trans fats."
      ]
    }
  ];

  return (
    <div className="bg-[#c2c38b] min-h-screen p-4 md:px-4 text-center">
      {/* Header - Reduced side padding */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-black mb-4 md:mb-6">Thali Tales</h1>
        <p className="text-lg md:text-xl text-white">
          How you treat your diet changes everything during your pregnancy! South
          Asian diets are naturally rich in essential nutrients, but we should be
          aware regarding the quality and quantity of food. While many of these
          practices are rooted in Ayurvedic and traditional medicine, it is
          important to balance them with modern nutritional science to ensure a
          healthy pregnancy.
        </p>

        {/* Thali Image */}
        <div className="flex justify-center my-8 md:my-10">
          <img
            src="/thali.png"
            alt="Thali"
            className="w-[300px] md:w-[400px] h-auto rounded-full shadow-lg"
          />
        </div>

        {/* Nutrient Sections - Reduced side spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {/* Folate & Fiber */}
          <div className="bg-[#a7a86e] p-4 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold text-black mb-3">
              Folate and Fiber
            </h2>
            <p className="text-base md:text-lg text-white">
              <strong>Whole Grains:</strong> Brown rice, whole wheat roti, jowar, and bajra provide fiber and essential vitamins.
            </p>
            <p className="text-base md:text-lg text-white mt-3">
              <strong>Beets, Oranges & Citrus Fruits:</strong> Rich in folate, Vitamin C, and antioxidants.
            </p>
            <p className="text-base md:text-lg text-white mt-3">
              <strong>Figs&Dates:</strong> Help with digestion and boost iron levels.
            </p>
          </div>

          {/* Calcium & Iron */}
          <div className="bg-[#a7a86e] p-4 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold text-black mb-3">
              Calcium and Iron
            </h2>
            <p className="text-base md:text-lg text-white">
              <strong>Leafy Greens:</strong> Spinach (Palak), Fenugreek (Methi), and Drumstick Leaves (Moringa) are loaded with iron and folic acid.
            </p>
            <p className="text-base md:text-lg text-white mt-3">
              <strong>Dairy Products:</strong> Yogurt (Dahi), Milk, and Buttermilk (Chaas) are excellent sources of calcium.
            </p>
            <p className="text-base md:text-lg text-white mt-3">
              <strong>Sesame Seeds(Till) &Almonds:</strong> Provide iron, calcium, and healthy fats.
            </p>
          </div>

          {/* Protein */}
          <div className="bg-[#a7a86e] p-4 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold text-black mb-3">Protein</h2>
            <p className="text-base md:text-lg text-white">
              <strong>Lentils (Dal):</strong> Packed with protein, fiber, and iron, lentils help prevent constipation and anemia.
            </p>
            <p className="text-base md:text-lg text-white mt-3">
              <strong>Chickpeas(Chana)&Kidney Beans(Rajma):</strong> Excellent plant-based protein sources that support muscle and tissue development.
            </p>
            <p className="text-base md:text-lg text-white mt-3">
              <strong>Paneer & Tofu:</strong> Great sources of protein and calcium for vegetarians.
            </p>
            <p className="text-base md:text-lg text-white mt-3">
              <strong>Eggs&Lean Meats:</strong> Provide high-quality protein, essential vitamins, and omega-3 fatty acids.
            </p>
          </div>
        </div>

        {/* Daily Meal Plan Section - Reduced side spacing */}
        <div className="bg-[#a7a86e] mt-10 p-6 md:p-8 text-center rounded-lg shadow-md">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">Daily Meal Plan</h2>
          <p className="text-lg md:text-xl text-white">
            <strong>Kitchen to Table: Nourish, Savor, Thrive!</strong>
            <br />
            Discover delicious, fresh recipes tailored to your dietary needs and nutritional goals. Enjoy meals that satisfy your cravings while keeping you healthy—one thoughtfully curated dish at a time.
          </p>
          <button
          className="mt-6 bg-[#d7d8a7] text-black px-6 py-2 rounded-md shadow-md border border-black hover:bg-[#bfc07d] transition text-lg"
          onClick={() => navigate("/daily-meal-plan")}
        >
          Join here!
        </button>
        </div>

        {/* Nutritional Values Section - Reduced side spacing */}
        <div className="mt-10">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">Nutritional Values</h2>
          <div className="space-y-3">
            {/* Protein */}
            <div
              className="bg-[#a7a86e] p-4 rounded-md shadow-md cursor-pointer"
              onClick={() => toggleSection("protein")}
            >
              <div className="flex justify-between">
                <span className="text-xl text-white">Protein (3-4 servings)</span>
                <span className="text-xl text-white">{openSection === "protein" ? "-" : "+"}</span>
              </div>
              {openSection === "protein" && (
                <div className="mt-3 bg-[#a7a86e] p-4 rounded-md shadow-md text-left">
                  <p className="font-bold text-white text-lg">1 serving =</p>
                  <ul className="list-disc ml-6 text-white text-base space-y-2">
                    <li>3 oz cooked lean meat</li>
                    <li>3 oz poultry</li>
                    <li>3 oz fish</li>
                    <li>1 egg</li>
                    <li>½ cup beans</li>
                    <li>¼ cup nuts</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Carbohydrates */}
            <div
              className="bg-[#a7a86e] p-4 rounded-md shadow-md cursor-pointer"
              onClick={() => toggleSection("carbs")}
            >
              <div className="flex justify-between">
                <span className="text-xl text-white">Carbohydrates (6-8 servings)</span>
                <span className="text-xl text-white">{openSection === "carbs" ? "-" : "+"}</span>
              </div>
              {openSection === "carbs" && (
                <div className="mt-3 bg-[#a7a86e] p-4 rounded-md shadow-md text-left">
                  <p className="font-bold text-white text-lg">1 serving =</p>
                  <ul className="list-disc ml-6 text-white text-base space-y-2">
                    <li>½ cup cooked rice/pasta</li>
                    <li>1 slice whole grain bread</li>
                    <li>½ cup oats</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Fats */}
            <div
              className="bg-[#a7a86e] p-4 rounded-md shadow-md cursor-pointer"
              onClick={() => toggleSection("fats")}
            >
              <div className="flex justify-between">
                <span className="text-xl text-white">Fats (4-5 servings)</span>
                <span className="text-xl text-white">{openSection === "fats" ? "-" : "+"}</span>
              </div>
              {openSection === "fats" && (
                <div className="mt-3 bg-[#a7a86e] p-4 rounded-md shadow-md text-left">
                  <p className="font-bold text-white text-lg">1 serving =</p>
                  <ul className="list-disc ml-6 text-white text-base space-y-2">
                    <li>1 tbsp olive oil</li>
                    <li>¼ avocado</li>
                    <li>10 almonds</li>
                    <li>1 tbsp chia seeds</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Dairy */}
            <div
              className="bg-[#a7a86e] p-4 rounded-md shadow-md cursor-pointer"
              onClick={() => toggleSection("dairy")}
            >
              <div className="flex justify-between">
                <span className="text-xl text-white">Dairy (3-4 servings)</span>
                <span className="text-xl text-white">{openSection === "dairy" ? "-" : "+"}</span>
              </div>
              {openSection === "dairy" && (
                <div className="mt-3 bg-[#a7a86e] p-4 rounded-md shadow-md text-left">
                  <p className="font-bold text-white text-lg">1 serving =</p>
                  <ul className="list-disc ml-6 text-white text-base space-y-2">
                    <li>1 cup milk/yogurt</li>
                    <li>1.5 oz cheese</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Foods to Avoid Section - Increased width and font size */}
        <div className="bg-[#a7a86e] mt-10 p-6 md:p-8 text-center rounded-lg shadow-md">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">Foods To Avoid</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foodsToAvoid.map((food, index) => (
              <div key={index} className="bg-[#c2c38b] p-5 rounded-lg shadow-md h-full">
                <h3 className="text-xl md:text-2xl font-semibold text-black mb-4">
                  {food.title}
                </h3>
                <ul className="text-lg text-white list-disc pl-6 space-y-3 text-left">
                  {food.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThaliPage;