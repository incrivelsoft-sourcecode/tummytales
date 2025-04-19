const express = require('express');
const { askAI, createNewAIChat, getAllchats, getAichatbyid,deleteAichat,editAIchat }= require('../controller/askai_controller')
const {momAndSupportMiddleware,authorizeMommiddleware} =require('../middleware/authMiddleware')
const askai_router = express.Router();

askai_router.post('/chat',authorizeMommiddleware,askAI);
askai_router.post("/chat/new",authorizeMommiddleware,createNewAIChat);
askai_router.get("/chats",authorizeMommiddleware,getAllchats);
askai_router.get("/chat/:chatId",authorizeMommiddleware,getAichatbyid);
askai_router.put("/ai/chat/:chatId",authorizeMommiddleware,editAIchat);
askai_router.delete("/chat/:chatId",authorizeMommiddleware, deleteAichat);

module.exports=askai_router