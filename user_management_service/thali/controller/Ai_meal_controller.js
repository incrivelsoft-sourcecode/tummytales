require("dotenv").config();
const Together = require("together-ai");
const AIMeal = require("../model/AI_meal");
const { Survey } = require("../../model/momsurvey");

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const generateMealAI = async (req, res) => {
  try {
    const { mealType, preferences, user_name, age } = req.body;

    if (!user_name || !mealType || !age) {
      return res.status(400).json({ error: "User name, age, and meal type are required" });
    }

    // Add a little twist for randomness
    const twistList = [
      "Make it rich in fiber.",
      "Use seasonal Indian vegetables.",
      "Make it quick and easy to prepare.",
      "Include at least one green leafy vegetable.",
      "Make it suitable for summer."
    ];
    const randomTwist = twistList[Math.floor(Math.random() * twistList.length)];

    const prompt = `
You are an AI meal planner.

Generate a healthy ${mealType} meal for a ${age}-year-old.
Requirements:
- Strictly Indian vegetarian (no eggs, no meat, no fish).
- Consider dietary preferences: ${preferences.dietary.join(', ') || 'None'}
- Consider cuisine preferences: ${preferences.cuisine.join(', ') || 'None'}
- Avoid ingredients: ${preferences.allergies.join(', ') || 'None'}

Extra twist: ${randomTwist}

⚠️ Very important: Your entire response must be a plain JSON object with the following structure. Do not include any explanation or wrap the JSON in quotes or markdown/code blocks.

{
  "title": "Meal Name",
  "servings": 1,
  "ingredients": ["item1", "item2", ...],
  "nutritionalValues": {
    "Calories": "xxx kcal",
    "Protein": "xx g",
    "Carbohydrates": "xx g",
    "Fat": "xx g",
    "Fiber": "xx g",
    "Calcium": "xx g",
    "Iron": "xx g"
  },
  "instructions": "step-by-step recipe",
  "image": "image url if any"
}

Respond only with the above JSON — nothing else.
`;

    // AI call
    const response = await together.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      temperature: 0.9,
      top_p: 0.95
    });

    const aiText = response.choices[0].message.content;

    let parsedMeal;
    try {
      parsedMeal = JSON.parse(aiText);
    } catch (err) {
      console.error("Failed to parse AI JSON response:", aiText);
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
        raw: aiText,
      });
    }

    const newMeal = new AIMeal({
      user_name,
      mealType,
      preferences,
      aiGeneratedMeal: parsedMeal,
    });

    await newMeal.save();

    res.status(201).json({ message: "Meal generated successfully", data: newMeal });

  } catch (error) {
    console.error("LLaMA AI Meal Error:", error);
    res.status(500).json({ error: "AI Meal generation failed" });
  }
};

module.exports = { generateMealAI };













/* main working..
require("dotenv").config();
const Together = require("together-ai");
const AIMeal = require("../model/AI_meal");
const { Survey } = require("../../model/momsurvey");

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });


const generateMealAI = async (req, res) => {
    try {
      const { mealType, preferences, user_name, age } = req.body;
  
      if (!user_name || !mealType || !age) {
        return res.status(400).json({ error: "User name, age, and meal type are required" });
      }
  
      
const prompt = `
You are an AI meal planner.

Generate a healthy ${mealType} meal for a ${age}-year-old.
Requirements:
- Strictly Indian vegetarian (no eggs, no meat, no fish).
- Consider dietary preferences: ${preferences.dietary.join(', ') || 'None'}
- Consider cuisine preferences: ${preferences.cuisine.join(', ') || 'None'}
- Avoid ingredients: ${preferences.allergies.join(', ') || 'None'}

⚠️ Very important: Your entire response must be a plain JSON object with the following structure. Do not include any explanation or wrap the JSON in quotes or markdown/code blocks.

{
  "title": "Meal Name",
  "servings": 1,
  "ingredients": ["item1", "item2", ...],
  "nutritionalValues": {
    "Protein": "xx g",
    "Carbohydrates": "xx g",
    "Fat": "xx g",
    "Fiber": "xx g",
    "Calcium": "xx g",
    "Iron": "xx g"
  },
  "instructions": "step-by-step recipe",
  "image": "image url if any"
}

Respond only with the above JSON — nothing else.
`;


      const response = await together.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      });
  
      const aiResponse = response.choices[0].message.content;
  
      const newMeal = new AIMeal({
        user_name,
        mealType,
        preferences,
        aiGeneratedMeal: {
          title: `${mealType} suggestion`,
          ingredients: [],
          instructions: aiResponse,
        },
      });
  
      await newMeal.save();
  
      res.status(201).json({ message: "Meal generated successfully", data: newMeal });
    } catch (error) {
      console.error("LLaMA AI Meal Error:", error);
      res.status(500).json({ error: "AI Meal generation failed" });
    }
  };
  
  module.exports={generateMealAI}*/