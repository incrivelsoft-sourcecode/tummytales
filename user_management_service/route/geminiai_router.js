const express = require('express');
const { askAI, createNewAIChat, getAllchats, getAichatbyid }= require('../controller/geminiai_controller')

const geminiai_router = express.Router();

geminiai_router.post('/chat',askAI);
geminiai_router.post("/chat/new",createNewAIChat);
geminiai_router.get("/chats",getAllchats);
geminiai_router.get("/chat/:chatId",getAichatbyid)

module.exports=geminiai_router