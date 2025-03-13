const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Chat name like "Chat 1", "Chat 2"
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
