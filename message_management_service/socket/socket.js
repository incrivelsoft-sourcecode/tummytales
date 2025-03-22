const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const User = require("../model/User.js");

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"],
        credentials: true
    },
    pingTimeout: 60000, // 60 seconds (default 20000)
    pingInterval: 45000  // 45 seconds (default 25000)
});

// User socket mapping
const userSocketMap = {};

// Function to get receiver socket ID
const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// Socket connection setup
const setupSocketConnection = () => {
    io.on("connection", async (socket) => {
        try {
            console.log("Socket.io connection attempt. Socket ID:", socket.id);
            
            const userId = socket.handshake.query.userId;
            console.log("User ID from query:", userId);
            
            if (!userId || userId === "undefined") {
                console.log("Invalid user ID. Disconnecting socket.");
                socket.disconnect(true);
                return;
            }

            const existingUser = await User.findById(userId);
            if (!existingUser) {
                console.log("User not found. Disconnecting socket.");
                socket.emit("error", {
                    type: "NOT_FOUND",
                    message: "User not found",
                    details: `No User found with ID: ${userId}`
                });
                socket.disconnect(true);
                return;
            }

            userSocketMap[userId] = socket.id;
            console.log("Added user to socket map:", userId, "->", socket.id);

            // Emit online users
            io.emit("getOnlineUsers", Object.keys(userSocketMap));

            // Handle disconnection
            socket.on("disconnect", () => {
                console.log("User disconnected", socket.id);
                delete userSocketMap[userId];
                io.emit("getOnlineUsers", Object.keys(userSocketMap));
            });
        } catch (error) {
            console.error("Error in connection handler:", error);
            socket.disconnect(true);
        }
    });
};

module.exports = {
    app,
    server,
    io,
    getReceiverSocketId,
    userSocketMap,
    setupSocketConnection
};