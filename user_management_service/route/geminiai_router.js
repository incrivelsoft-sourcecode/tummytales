const express = require('express');
const { askAI, createNewAIChat, getAllchats, getAichatbyid,deleteAichat,editAIchat }= require('../controller/geminiai_controller')

const geminiai_router = express.Router();

geminiai_router.post('/chat',askAI);
geminiai_router.post("/chat/new",createNewAIChat);
geminiai_router.get("/chats",getAllchats);
geminiai_router.get("/chat/:chatId",getAichatbyid);
geminiai_router.put("/ai/chat/:chatId",editAIchat);
geminiai_router.delete("/chat/:chatId", deleteAichat);

module.exports=geminiai_router