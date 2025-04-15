import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const MealView = () => {
  const { type } = useParams(); // Gets Breakfast, Lunch, etc. from the URL
  const [meal, setMeal] = useState(null);

  // Retrieve the stored username from localStorage
  const user_name = localStorage.getItem("userName") || ""; // Retrieve stored username

  // Log the retrieved username for debugging
  console.log("Retrieved user_name:", user_name);

  useEffect(() => {
    // Dynamically fetch meal data based on the type from the URL
    axios.get(`/api/meal/latest?mealType=${type}`)
      .then((res) => {
        console.log("Meal response 👉", res.data); // Log output here
        setMeal(res.data);
      })
      .catch((err) => {
        console.error("API error", err);
      });
  }, [type]);

  if (!meal) return <div className="text-center p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-amber-50 text-gray-800 p-8">
      <h1 className="text-4xl font-bold mb-2 text-center">{meal.title} ({type})</h1>
      <p className="text-center text-lg mb-8">Servings: {meal.servings}</p>

      {user_name && (
        <p className="text-center text-lg mb-8">
          Welcome, {user_name}!
        </p>
      )}

      {meal.image && (
        <div className="flex justify-center mb-8">
          <img src={meal.image} alt={meal.title} className="rounded shadow-md w-1/2" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
          <ul className="list-disc ml-6">
            {meal.ingredients.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Nutritional Values</h2>
          <ul className="list-disc ml-6">
            {Object.entries(meal.nutritionalValues).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-2">Instructions</h2>
        <p>{meal.instructions}</p>
      </div>
    </div>
  );
};

export default MealView;
