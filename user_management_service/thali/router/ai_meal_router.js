const express = require("express");
const AImeal_router = express.Router();
const { generateMealAI } = require("../controller/Ai_meal_controller");

AImeal_router.post("/generate-meal", generateMealAI);

module.exports = AImeal_router;
