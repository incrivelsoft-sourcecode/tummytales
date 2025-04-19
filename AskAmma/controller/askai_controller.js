
require("dotenv").config();
const Together = require("together-ai");
const AIChat = require("../model/AskAImodel");

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const askAI = async (req, res) => {
    try {
        const { message, chatId, userId, } = req.body;

        if (!chatId || ! userId) {
            return res.status(400).json({ error: "Chat ID and  userId, are required" });
        }

        const response = await together.chat.completions.create({
            messages: [{ role: "user", content: message }],
            model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        });

        const aiResponse = response.choices[0].message.content;

        // Find chat that belongs to this user
        const chat = await AIChat.findOne({ _id: chatId, userId });
        if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

        // // Find chat and update it
        // const chat = await AIChat.findById(chatId);
        // if (!chat) return res.status(404).json({ error: "Chat not found" });

        //  If this is the first message, update chat name
        if (!chat.name || chat.name === "New Chat") {
            chat.name = message.length > 30 ? message.substring(0, 30) + "..." : message;
        }

        chat.messages.push({ question: message, answer: aiResponse });
        await chat.save();

        res.json({ reply: aiResponse, chatName: chat.name });
    } catch (error) {
        console.error("Llama API Error:", error);
        res.status(500).json({ error: "AI request failed" });
    }
};




// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// const askAI = async (req, res) => {
//     try {
//         const { message,chatId } = req.body;

//         if (!chatId) {
//             return res.status(400).json({ error: "Chat ID is required" });
//         }

//         const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

//         const result = await model.generateContent({
//             contents: [{ parts: [{ text: message }] }],
//         });

//         const response = result.response.candidates[0].content.parts[0].text; // Extract AI response

//         // Find chat and update it
//         const chat = await AIChat.findById(chatId);
//         if (!chat) return res.status(404).json({ error: "Chat not found" });

//          // ✅ If this is the first message, update chat name
//          if (!chat.name || chat.name === "New Chat") {
//             chat.name = message.length > 30 ? message.substring(0, 30) + "..." : message; // Trim long names
//         }

//         chat.messages.push({ question: message, answer: response });
//         await chat.save();

//        // res.json({ reply: response });
//        res.json({ reply: response, chatName: chat.name });
//     } catch (error) {
//         console.error("Gemini API Error:", error);
//         res.status(500).json({ error: "AI request failed" });
//     }
// }



const createNewAIChat = async (req, res) => {
    try {

        const {  userId } = req.body; 

        if (! userId) {
            return res.status(400).json({ error: "User Id is required" });
        }
        const newChat = new AIChat({ userId, name: "", messages: [] }); // Start with an empty name
        await newChat.save();
        res.json({ chatId: newChat._id, name: "New Chat" }); // Return "New Chat" as default
    } catch (error) {
        console.error("Error in creating new AI chat", error);
        return res.status(500).json({ error: "Failed to create new AI Chat" });
    }
};


const getAllchats = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "User name is required" });
        }

        const chats = await AIChat.find({userId}, "_id name createdAt")
                                  .sort({ createdAt: -1 }); //Sort by newest first
        res.json({ Aichats: chats });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to retrieve chats" });
    }
};

const getAichatbyid= async(req,res)=>{
    try{
        const { chatId } = req.params;
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "User Id is required" });
        }
        // const chat = await AIChat.findById(chatId);

        // if (!chat) return res.status(404).json({ error: "Chat not found" });

        const chat = await AIChat.findOne({ _id: chatId, userId });

        if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

        res.json({ messages: chat.messages });
    }catch(error){
        console.error("Error fetching chat:", error);
        res.status(500).json({ error: "Failed to retrieve chat" });
    }
}

const editAIchat = async(req,res)=>{
    try {
        const { chatId } = req.params;
        const { name,userId } = req.body;

        if (!name||!userId) {
            return res.status(400).json({ error: "Chat name and User Id are required" });
        }

       
         const chat = await AIChat.findOneAndUpdate(
            { _id: chatId, userId },
            { name },
            { new: true }
        );

        if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

        res.json({ message: "Chat name updated successfully", chat });
    } catch (error) {
        console.error("Error updating chat name:", error);
        res.status(500).json({ error: "Failed to update chat name" });
    }
}

const deleteAichat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const { userId } = req.query; 

        if (!userId) {
            return res.status(400).json({ error: "User Id is required" });
        }

        // Find chat belonging to the user
        const chat = await AIChat.findOne({ _id: chatId, userId });

        if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

        // Delete the chat
        await AIChat.findByIdAndDelete(chatId);

        res.json({ message: "Chat deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
};



module.exports = { askAI,createNewAIChat,getAllchats,getAichatbyid,deleteAichat,editAIchat };
















/*const AIChat=require('../model/AskAImodel')
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const askAI = async (req, res) => {
    try {
        const { message,chatId } = req.body;

        if (!chatId) {
            return res.status(400).json({ error: "Chat ID is required" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent({
            contents: [{ parts: [{ text: message }] }],
        });

        const response = result.response.candidates[0].content.parts[0].text; // Extract AI response

        // Find chat and update it
        const chat = await AIChat.findById(chatId);
        if (!chat) return res.status(404).json({ error: "Chat not found" });

         // ✅ If this is the first message, update chat name
         if (!chat.name || chat.name === "New Chat") {
            chat.name = message.length > 30 ? message.substring(0, 30) + "..." : message; // Trim long names
        }

        chat.messages.push({ question: message, answer: response });
        await chat.save();

       // res.json({ reply: response });
       res.json({ reply: response, chatName: chat.name });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "AI request failed" });
    }
}

const createNewAIChat = async (req, res) => {
    try {
        const newChat = new AIChat({ name: "", messages: [] }); // Start with an empty name
        await newChat.save();
        res.json({ chatId: newChat._id, name: "New Chat" }); // Return "New Chat" as default
    } catch (error) {
        console.error("Error in creating new AI chat", error);
        return res.status(500).json({ error: "Failed to create new AI Chat" });
    }
};


const getAllchats = async (req, res) => {
    try {
        const chats = await AIChat.find({}, "_id name createdAt")
                                  .sort({ createdAt: -1 }); //Sort by newest first
        res.json({ Aichats: chats });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to retrieve chats" });
    }
};

const getAichatbyid= async(req,res)=>{
    try{
        const { chatId } = req.params;
        const chat = await AIChat.findById(chatId);

        if (!chat) return res.status(404).json({ error: "Chat not found" });

        res.json({ messages: chat.messages });
    }catch(error){
        console.error("Error fetching chat:", error);
        res.status(500).json({ error: "Failed to retrieve chat" });
    }
}

const editAIchat = async(req,res)=>{
    try {
        const { chatId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Chat name is required" });
        }

        const chat = await AIChat.findByIdAndUpdate(
            chatId,
            { name },
            { new: true }
        );

        if (!chat) return res.status(404).json({ error: "Chat not found" });

        res.json({ message: "Chat name updated successfully", chat });
    } catch (error) {
        console.error("Error updating chat name:", error);
        res.status(500).json({ error: "Failed to update chat name" });
    }
}

const deleteAichat = async (req, res) => {
    try {
        const { chatId } = req.params;

        // Check if the chat exists
        const chat = await AIChat.findById(chatId);
        if (!chat) return res.status(404).json({ error: "Chat not found" });

        // Delete the chat
        await AIChat.findByIdAndDelete(chatId);

        res.json({ message: "Chat deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
};



module.exports = { askAI,createNewAIChat,getAllchats,getAichatbyid,deleteAichat,editAIchat };




*/










/*main
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askAI = async (req, res) => {
    try {
        const { message } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // ✅ Correct model

        const result = await model.generateContent({
            contents: [{ parts: [{ text: message }] }],
        });

        const response = result.response.candidates[0].content.parts[0].text; // ✅ Extract AI response

        res.json({ reply: response });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "AI request failed" });
    }
}


const createNewAIChat= async(req,res)=>{
    try{
        const chatCount=await AIChat.countDocuments();
        const newChat= new AIChat({name:`Chat ${chatCount + 1}`,message:[]});
        await newChat.save();
        res.json({ chatId: newChat._id, name: newChat.name });
    }catch(error){
        console.error('Error in creating new ai chat',error);
        return res.status(500).json({error:"failed to create new AI Chat"})
    }
}
const getAllchats = async (req, res) => {
    try {
        const Aichats = await AIChat.find({}, "_id name createdAt messages"); // Include 'messages' field

        return res.status(200).json({
            message: "Chats retrieved successfully",
            Aichats,
        });
    } catch (error) {
        console.error("Error fetching chats:", error);
        return res.status(500).json({ error: "Failed to retrieve chats" });
    }
};



module.exports = { askAI };*/
