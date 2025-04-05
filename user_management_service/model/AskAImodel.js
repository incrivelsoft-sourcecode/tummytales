const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    user_name: { 
    type: String,
    ref: "UserDetails",
    required: true 
     }, 
    name:{
      type:String,
      required:true,
    },
    name: { type: String, default: "" }, // ✅ Default name to avoid undefined issues
    messages: [
        {
            question: { type: String, required: true },
            answer: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now } // Chat creation timestamp
});

const AIChat = mongoose.model("AIChat", chatSchema);
module.exports = AIChat;
