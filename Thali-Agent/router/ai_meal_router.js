const express = require("express");
const AImeal_router = express.Router();
const { generateMealAI,getLatestMealByMealType} = require("../controller/Ai_meal_controller");
const {authorizeMommiddleware }= require('../middleware/authMiddleware')

AImeal_router.post("/generate-meal",authorizeMommiddleware, generateMealAI);
AImeal_router.get("/meal/latest",authorizeMommiddleware, getLatestMealByMealType)

module.exports = AImeal_router;
