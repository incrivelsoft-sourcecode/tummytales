require("dotenv").config();
const cron = require("node-cron");
const Together = require("together-ai");
const AIMeal = require("../model/AI_meal");
 
const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });
 
// Prompt generator
function createPrompt({ mealType, age, preferences }) {
  const twistList = [
    "Make it rich in fiber.",
    "Use seasonal Indian vegetables.",
    "Make it quick and easy to prepare.",
    "Include at least one green leafy vegetable.",
    "Make it suitable for summer."
  ];
  const randomTwist = twistList[Math.floor(Math.random() * twistList.length)];
 
  return `
You are an AI meal planner.
 
Generate a healthy ${mealType} meal for a ${age}-year-old.
Requirements:
- Strictly Indian vegetarian (no eggs, no meat, no fish).
- Consider dietary preferences: ${preferences?.dietary?.join(', ') || 'None'}
- Consider cuisine preferences: ${preferences?.cuisine?.join(', ') || 'None'}
- Avoid ingredients: ${preferences?.allergies?.join(', ') || 'None'}
 
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
`;
}
 
cron.schedule("* * * * *", async () => {
    const now = new Date();
    const nowISO = now.toISOString(); // force to UTC ISO
 
    console.log("\n⏰ Checking for meals to generate...");
    console.log("🕒 Server Time:", nowISO);
 
    try {
      const pendingMeals = await AIMeal.find({
        reminderTime: { $lte: nowISO },
        aiGeneratedMeal: null
      });
 
      console.log("📋 Pending meals found:", pendingMeals.length);
 
      if (pendingMeals.length === 0) {
        console.log("😴 No meals to generate at this time.");
        return;
      }
 
    for (const meal of pendingMeals) {
      console.log(`✨ Generating meal for: ${meal.user_name}, Type: ${meal.mealType}`);
 
      const prompt = createPrompt(meal);
 
      const response = await together.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        temperature: 0.9,
        top_p: 0.95
      });
 
      const aiText = response.choices[0].message.content;
 
      const parsedMeal = JSON.parse(aiText);
 
      meal.aiGeneratedMeal = parsedMeal;
      await meal.save();
 
      console.log(`Meal generated and saved for ${meal.user_name}`);
    }
  } catch (err) {
    console.error(" Cron job error:", err);
  }
});