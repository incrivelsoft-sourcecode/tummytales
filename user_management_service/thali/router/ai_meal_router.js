const express = require("express");
const AImeal_router = express.Router();
const { generateMealAI,getMealById} = require("../controller/Ai_meal_controller");

AImeal_router.post("/generate-meal", generateMealAI);
AImeal_router.get("/meal/:id", getMealById)

module.exports = AImeal_router;
